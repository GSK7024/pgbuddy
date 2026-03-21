import { useEffect, useState, useCallback } from "react";
import { Users, Plus, UserCheck, Search, Upload, FileText, Phone, Shield, X, Eye, IndianRupee, History, UserX, Download, ArrowUpDown, ArrowLeftRight, MoveRight, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import OverLimitBanner from "@/components/OverLimitBanner";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface TenantAssignment {
  id: string;
  tenant_id: string;
  room_id: string;
  property_id: string;
  move_in_date: string;
  move_out_date: string | null;
  is_active: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  id_proof_type: string | null;
  id_proof_number: string | null;
  notes: string | null;
  custom_rent: number | null;
  tenant_email?: string | null;
  tenant_phone?: string | null;
  tenant_name?: string | null;
  deposit_status?: string | null;
  rooms?: { room_number: string };
  properties?: { name: string };
  profiles?: { full_name: string; phone: string | null };
}

interface RoomWithCapacity {
  id: string;
  room_number: string;
  property_id: string;
  capacity: number;
  rent_amount: number;
  is_vacant: boolean;
}

interface BedOption {
  id: string;
  room_id: string;
  bed_label: string;
  sharing_type: string;
  rent_amount: number;
  deposit_amount: number;
  is_vacant: boolean;
}

const Tenants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isReadOnly, isOverLimit, bedCount, bedLimit, limits } = useSubscriptionGuard();
  const { effectiveOwnerId, isStaff, accessiblePropertyIds, loading: staffLoading } = useStaffAccess();
  const [assignments, setAssignments] = useState<TenantAssignment[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<RoomWithCapacity[]>([]);
  const [allBeds, setAllBeds] = useState<BedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailTenant, setDetailTenant] = useState<TenantAssignment | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [rentHistory, setRentHistory] = useState<{ id: string; old_rent: number | null; new_rent: number; changed_at: string; notes: string | null }[]>([]);
  const [tenantLimit, setTenantLimit] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPropertyId, setFilterPropertyId] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [assignmentType, setAssignmentType] = useState<"existing" | "new">("existing");
  const [checkingRent, setCheckingRent] = useState(false);
  const [lastRentStatus, setLastRentStatus] = useState<{ status: string; amount: number } | null>(null);

  // Form - assign
  const [tenantEmail, setTenantEmail] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [bedId, setBedId] = useState("");
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split("T")[0]);
  const [customRent, setCustomRent] = useState("");
  const [assignPhone, setAssignPhone] = useState("");
  const [assignName, setAssignName] = useState("");
  const [foundTenant, setFoundTenant] = useState<{ user_id: string; full_name: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [initialRentPaid, setInitialRentPaid] = useState(false);
  const [depositStatus, setDepositStatus] = useState<"pending" | "paid">("pending");

  // Form - detail edit
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [idProofType, setIdProofType] = useState("");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [tenantNotes, setTenantNotes] = useState("");
  const [detailRent, setDetailRent] = useState("");
  const [rentChangeNote, setRentChangeNote] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  // Transfer / Swap state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferPropertyId, setTransferPropertyId] = useState("");
  const [transferRoomId, setTransferRoomId] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapTargetId, setSwapTargetId] = useState("");
  const [swapping, setSwapping] = useState(false);

  const fetchData = async () => {
    if (!effectiveOwnerId) return;
    const [assignRes, propRes, roomRes, subRes, bedRes] = await Promise.all([
      supabase.from("tenant_assignments").select("*, rooms(room_number, rent_amount), properties(name)").order("created_at", { ascending: false }),
      supabase.from("properties").select("id, name").eq("owner_id", effectiveOwnerId),
      supabase.from("rooms").select("id, room_number, property_id, capacity, rent_amount, is_vacant"),
      supabase.from("subscriptions").select("*, subscription_plans(tenant_limit)").eq("user_id", effectiveOwnerId).eq("status", "active").maybeSingle(),
      (supabase as any).from("beds").select("*").eq("is_vacant", true).order("bed_label", { ascending: true }),
    ]);

    const data = assignRes.data ?? [];
    const tenantIds = [...new Set(data.map(a => a.tenant_id))];
    let profilesMap: Record<string, { full_name: string; phone: string | null }> = {};
    if (tenantIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", tenantIds);
      profiles?.forEach(p => { profilesMap[p.user_id] = p; });
    }

    let fetchedAssignments = data.map(a => ({ ...a, profiles: a.tenant_id ? profilesMap[a.tenant_id] : null }));
    let fetchedProps = propRes.data ?? [];
    let fetchedRooms = roomRes.data ?? [];
    // Staff can only see their assigned properties
    if (isStaff && accessiblePropertyIds.length > 0) {
      fetchedProps = fetchedProps.filter(p => accessiblePropertyIds.includes(p.id));
      fetchedRooms = fetchedRooms.filter(r => accessiblePropertyIds.includes(r.property_id));
      fetchedAssignments = fetchedAssignments.filter(a => accessiblePropertyIds.includes(a.property_id));
    }
    setAssignments(fetchedAssignments);
    setProperties(fetchedProps);
    setRooms(fetchedRooms);
    setAllBeds((bedRes.data ?? []) as unknown as BedOption[]);

    // Set tenant limit from subscription
    const limit = (subRes.data as any)?.subscription_plans?.tenant_limit;
    setTenantLimit(limit !== undefined && limit !== null ? limit : 5);
    setLoading(false);
  };

  useEffect(() => { if (!staffLoading) fetchData(); }, [effectiveOwnerId, staffLoading]);

  // Count active assignments per room
  const getActiveCountForRoom = (roomId: string) => {
    return assignments.filter(a => a.room_id === roomId && a.is_active).length;
  };

  // Rooms that have available beds for a given property
  const availableRoomsForProperty = rooms.filter(r => {
    if (r.property_id !== propertyId) return false;
    const activeCount = getActiveCountForRoom(r.id);
    return activeCount < r.capacity;
  });

  // When room is selected, pre-fill rent
  const handleRoomSelect = (rId: string) => {
    setRoomId(rId);
    setBedId("");
    // If the room has vacant beds, don't auto-fill rent — wait for bed selection
    const vacantBeds = allBeds.filter(b => b.room_id === rId);
    if (vacantBeds.length === 0) {
      // Fallback: use room rent
      const room = rooms.find(r => r.id === rId);
      if (room) setCustomRent(String(room.rent_amount));
    } else if (vacantBeds.length === 1) {
      // Auto-select single bed
      setBedId(vacantBeds[0].id);
      setCustomRent(String(vacantBeds[0].rent_amount));
    } else {
      setCustomRent("");
    }
  };

  const handleBedSelect = (bId: string) => {
    setBedId(bId);
    const bed = allBeds.find(b => b.id === bId);
    if (bed) setCustomRent(String(bed.rent_amount));
  };

  const vacantBedsForRoom = roomId ? allBeds.filter(b => b.room_id === roomId) : [];

  const searchTenant = async () => {
    if (!tenantEmail.trim()) return;
    setSearching(true);
    setFoundTenant(null);
    setLastRentStatus(null);
    const { data, error } = await supabase.rpc("find_user_by_email", { _email: tenantEmail.trim() });
    if (error || !data || data.length === 0) {
      toast({ title: "Email not registered yet", description: "You can still assign the room; they'll be linked once they sign up." });
    } else {
      setFoundTenant(data[0]);
      // Check last rent status
      setCheckingRent(true);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { data: rentData } = await supabase
        .from("rent_payments")
        .select("status, amount")
        .eq("tenant_id", data[0].user_id)
        .eq("month", currentMonth)
        .maybeSingle();
      if (rentData) setLastRentStatus(rentData);
      setCheckingRent(false);
    }
    setSearching(false);
  };

  const updateRoomVacancy = async (rId: string) => {
    const room = rooms.find(r => r.id === rId);
    if (!room) return;
    // Re-count from DB
    const { count } = await supabase
      .from("tenant_assignments")
      .select("id", { count: "exact", head: true })
      .eq("room_id", rId)
      .eq("is_active", true);
    const activeCount = count ?? 0;
    const shouldBeVacant = activeCount < room.capacity;
    await supabase.from("rooms").update({ is_vacant: shouldBeVacant }).eq("id", rId);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tenantEmail || !propertyId || !roomId) return;

    // Check tenant limit
    const activeTenants = assignments.filter(a => a.is_active).length;
    if (tenantLimit !== -1 && activeTenants >= tenantLimit) {
      toast({
        title: "Tenant limit reached",
        description: `Your current plan allows up to ${tenantLimit} tenants. Upgrade your plan to add more.`,
        variant: "destructive",
      });
      return;
    }

    setAssigning(true);

    const rentValue = customRent ? parseFloat(customRent) : null;

    const { error: assignError } = await supabase.from("tenant_assignments").insert({
      tenant_id: foundTenant ? foundTenant.user_id : null,
      tenant_email: tenantEmail.trim(),
      tenant_name: assignName.trim() || (foundTenant ? foundTenant.full_name : null),
      tenant_phone: assignPhone.trim(),
      property_id: propertyId,
      room_id: roomId,
      bed_id: bedId || null,
      move_in_date: moveInDate,
      custom_rent: rentValue,
      deposit_status: depositStatus,
    });

    if (assignError) {
      toast({ title: "Error", description: assignError.message, variant: "destructive" });
      setAssigning(false);
      return;
    }

    // Auto-generate paid rent if requested
    if (initialRentPaid) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      await supabase.from("rent_payments").insert({
        tenant_id: foundTenant ? foundTenant.user_id : null,
        tenant_email: tenantEmail.trim(),
        tenant_name: assignName.trim() || (foundTenant ? foundTenant.full_name : null),
        tenant_phone: assignPhone.trim(),
        property_id: propertyId,
        room_id: roomId,
        amount: rentValue || (rooms.find(r => r.id === roomId)?.rent_amount ?? 0),
        month: currentMonth,
        status: "paid",
        payment_date: new Date().toISOString(),
        payment_type: "rent",
      });
    }

    // Auto-generate Deposit record if applicable
    const selectedBedRaw = allBeds.find(b => b.id === bedId);
    if (selectedBedRaw && selectedBedRaw.deposit_amount > 0) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      await supabase.from("rent_payments").insert({
        tenant_id: foundTenant ? foundTenant.user_id : null,
        tenant_email: tenantEmail.trim(),
        tenant_name: assignName.trim() || (foundTenant ? foundTenant.full_name : null),
        tenant_phone: assignPhone.trim(),
        property_id: propertyId,
        room_id: roomId,
        amount: selectedBedRaw.deposit_amount,
        month: currentMonth,
        status: depositStatus,
        payment_date: depositStatus === "paid" ? new Date().toISOString() : null,
        payment_type: "deposit",
      });
    }

    // Mark bed as occupied
    if (bedId) {
      await (supabase as any).from("beds").update({ is_vacant: false }).eq("id", bedId);
    }
    await updateRoomVacancy(roomId);
    toast({ title: "Tenant assigned successfully!" });
    setDialogOpen(false);
    resetForm();
    fetchData();
    setAssigning(false);
  };

  const resetForm = () => {
    setTenantEmail(""); setPropertyId(""); setRoomId("");
    setMoveInDate(new Date().toISOString().split("T")[0]);
    setCustomRent(""); setAssignPhone(""); setAssignName(""); setFoundTenant(null);
    setInitialRentPaid(false);
    setDepositStatus("pending");
  };

  const handleDeactivate = async (id: string, rId: string) => {
    await supabase.from("tenant_assignments").update({
      is_active: false,
      move_out_date: new Date().toISOString().split("T")[0],
    }).eq("id", id);
    // A bed freed up, so room should be vacant (has available beds)
    await supabase.from("rooms").update({ is_vacant: true }).eq("id", rId);
    toast({ title: "Tenant moved out" });
    setDetailTenant(null);
    fetchData();
  };

  const openDetail = async (a: TenantAssignment) => {
    setDetailTenant(a);
    setEmergencyName(a.emergency_contact_name ?? "");
    setEmergencyPhone(a.emergency_contact_phone ?? "");
    setIdProofType(a.id_proof_type ?? "");
    setIdProofNumber(a.id_proof_number ?? "");
    setTenantNotes(a.notes ?? "");
    setDetailRent(String(a.custom_rent ?? (a as any).rooms?.rent_amount ?? ""));
    setTenantPhone(a.profiles?.phone ?? a.tenant_phone ?? "");
    setTenantName(a.profiles?.full_name ?? a.tenant_name ?? "");
    // Fetch documents and rent history in parallel
    const [docsRes, historyRes] = await Promise.all([
      supabase.storage.from("tenant-documents").list(a.id),
      supabase.from("rent_history").select("id, old_rent, new_rent, changed_at, notes").eq("assignment_id", a.id).order("changed_at", { ascending: false }),
    ]);
    if (docsRes.data && docsRes.data.length > 0) {
      const docs = docsRes.data.map(f => {
        const { data: urlData } = supabase.storage.from("tenant-documents").getPublicUrl(`${a.id}/${f.name}`);
        return { name: f.name, url: urlData.publicUrl };
      });
      setDocuments(docs);
    } else {
      setDocuments([]);
    }
    setRentHistory(historyRes.data ?? []);
  };

  const saveDetails = async () => {
    if (!detailTenant || !user) return;
    setSavingDetails(true);
    const rentValue = detailRent ? parseFloat(detailRent) : null;
    const oldRent = detailTenant.custom_rent ?? (detailTenant as any).rooms?.rent_amount ?? 0;
    const newRent = rentValue ?? (detailTenant as any).rooms?.rent_amount ?? 0;

    const { error } = await supabase.from("tenant_assignments").update({
      emergency_contact_name: emergencyName || null,
      emergency_contact_phone: emergencyPhone || null,
      id_proof_type: idProofType || null,
      id_proof_number: idProofNumber || null,
      notes: tenantNotes || null,
      custom_rent: rentValue,
      tenant_name: tenantName.trim() || null,
      tenant_phone: tenantPhone.trim() || null,
    }).eq("id", detailTenant.id);

    if (!error && detailTenant.tenant_email) {
      await supabase.from("rent_payments").update({
        tenant_name: tenantName.trim() || null,
        tenant_phone: tenantPhone.trim() || null,
      }).eq("tenant_email", detailTenant.tenant_email).eq("status", "pending");
    }

    // Update tenant phone in profiles
    if (!error && detailTenant.tenant_id && tenantPhone !== (detailTenant.profiles?.phone ?? "")) {
      await supabase.from("profiles").update({ phone: tenantPhone.trim() || null }).eq("user_id", detailTenant.tenant_id);
    }

    // Log rent change if different
    if (!error && Number(oldRent) !== Number(newRent)) {
      await supabase.from("rent_history").insert({
        assignment_id: detailTenant.id,
        old_rent: Number(oldRent),
        new_rent: Number(newRent),
        changed_by: user.id,
        notes: rentChangeNote.trim() || null,
      });
      setRentChangeNote("");
      // Refresh history
      const { data: hist } = await supabase.from("rent_history").select("id, old_rent, new_rent, changed_at, notes").eq("assignment_id", detailTenant.id).order("changed_at", { ascending: false });
      setRentHistory(hist ?? []);
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tenant details saved!" });
      fetchData();
    }
    setSavingDetails(false);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!detailTenant || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }
    setUploading(true);
    const filePath = `${detailTenant.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("tenant-documents").upload(filePath, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document uploaded!" });
      openDetail(detailTenant);
    }
    setUploading(false);
    e.target.value = "";
  };

  const downloadDoc = async (name: string) => {
    if (!detailTenant) return;
    const { data, error } = await supabase.storage.from("tenant-documents").createSignedUrl(`${detailTenant.id}/${name}`, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const handleTransfer = async () => {
    if (!detailTenant || !transferRoomId || !user) return;
    setTransferring(true);

    const targetRoom = rooms.find(r => r.id === transferRoomId);
    const oldRoomId = detailTenant.room_id;
    const targetPropertyId = transferPropertyId || detailTenant.property_id;

    // Update assignment to new room/property
    const { error } = await supabase.from("tenant_assignments").update({
      room_id: transferRoomId,
      property_id: targetPropertyId,
      custom_rent: targetRoom ? targetRoom.rent_amount : detailTenant.custom_rent,
    }).eq("id", detailTenant.id);

    if (error) {
      toast({ title: "Transfer failed", description: error.message, variant: "destructive" });
    } else {
      // Update vacancy for both rooms
      await updateRoomVacancy(oldRoomId);
      await updateRoomVacancy(transferRoomId);
      toast({ title: "Tenant transferred successfully!" });
      setDetailTenant(null);
      setTransferOpen(false);
      fetchData();
    }
    setTransferring(false);
  };

  const handleSwap = async () => {
    if (!detailTenant || !swapTargetId || !user) return;
    setSwapping(true);

    const targetAssignment = assignments.find(a => a.id === swapTargetId);
    if (!targetAssignment) {
      toast({ title: "Error", description: "Target tenant not found", variant: "destructive" });
      setSwapping(false);
      return;
    }

    // Swap room_id and property_id between both assignments
    const [res1, res2] = await Promise.all([
      supabase.from("tenant_assignments").update({
        room_id: targetAssignment.room_id,
        property_id: targetAssignment.property_id,
      }).eq("id", detailTenant.id),
      supabase.from("tenant_assignments").update({
        room_id: detailTenant.room_id,
        property_id: detailTenant.property_id,
      }).eq("id", targetAssignment.id),
    ]);

    if (res1.error || res2.error) {
      toast({ title: "Swap failed", description: (res1.error || res2.error)?.message, variant: "destructive" });
    } else {
      toast({ title: "Tenants swapped successfully!" });
      setDetailTenant(null);
      setSwapOpen(false);
      fetchData();
    }
    setSwapping(false);
  };

  // Available rooms for transfer (exclude current room, must have capacity)
  const transferAvailableRooms = rooms.filter(r => {
    if (!detailTenant) return false;
    const tPropId = transferPropertyId || detailTenant.property_id;
    if (r.property_id !== tPropId) return false;
    if (r.id === detailTenant.room_id) return false;
    const activeCount = getActiveCountForRoom(r.id);
    return activeCount < r.capacity;
  });

  // Active tenants for swap (exclude current tenant)
  const swappableTenants = assignments.filter(a => {
    if (!detailTenant) return false;
    return a.is_active && a.id !== detailTenant.id;
  });

  const getTenantRent = (a: TenantAssignment) => {
    return a.custom_rent ?? (a as any).rooms?.rent_amount ?? 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isOverLimit && (
          <OverLimitBanner bedCount={bedCount} bedLimit={bedLimit} planName={limits.name} />
        )}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Tenants</h1>
            <p className="text-muted-foreground">Manage tenant assignments and details</p>
          </div>
          <div className="flex items-center gap-2">
            {assignments.length > 0 && (
              <Button variant="outline" className="gap-2" onClick={() => {
                const rows = assignments.map(a => ({
                  Name: a.profiles?.full_name || "Unknown",
                  Phone: a.profiles?.phone || "",
                  Property: (a as any).properties?.name || "",
                  Room: (a as any).rooms?.room_number || "",
                  "Rent (₹)": getTenantRent(a),
                  Status: a.is_active ? "Active" : "Moved Out",
                  "Move-in": a.move_in_date,
                  "Move-out": a.move_out_date || "",
                  "ID Proof": a.id_proof_type ? `${a.id_proof_type}: ${a.id_proof_number}` : "",
                  "Emergency Contact": a.emergency_contact_name ? `${a.emergency_contact_name} (${a.emergency_contact_phone || ""})` : "",
                  Notes: a.notes || "",
                }));
                const headers = Object.keys(rows[0]);
                const csv = [
                  headers.join(","),
                  ...rows.map(r => headers.map(h => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(","))
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `tenants-${new Date().toISOString().slice(0, 10)}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary gap-2" disabled={isReadOnly}><Plus className="w-4 h-4" /> Assign Tenant</Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Tenant to Room</DialogTitle></DialogHeader>
              {tenantLimit !== -1 && assignments.filter(a => a.is_active).length >= tenantLimit ? (
                <div className="space-y-4 text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    You've reached your limit of <strong>{tenantLimit} tenants</strong> on your current plan.
                  </p>
                  <Button asChild className="gradient-primary">
                    <Link to="/dashboard/subscription">Upgrade Plan</Link>
                  </Button>
                </div>
              ) : (
              <form onSubmit={handleAssign} className="space-y-4">
                <div className="flex p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${assignmentType === "existing" ? "bg-background shadow-sm" : "hover:text-primary"}`}
                    onClick={() => { setAssignmentType("existing"); resetForm(); }}
                  >
                    Existing Tenant
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${assignmentType === "new" ? "bg-background shadow-sm" : "hover:text-primary"}`}
                    onClick={() => { setAssignmentType("new"); resetForm(); setAssignmentType("new"); }}
                  >
                    New Tenant (Email Only)
                  </button>
                </div>

                <div className="space-y-2">
                  <Label>Tenant Email *</Label>
                  <div className="flex gap-2">
                    <Input type="email" value={tenantEmail} onChange={e => { setTenantEmail(e.target.value); setFoundTenant(null); }} placeholder="tenant@example.com" required />
                    {assignmentType === "existing" && (
                      <Button type="button" variant="outline" onClick={searchTenant} disabled={searching}>
                        <Search className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {searching && <p className="text-[10px] text-muted-foreground animate-pulse">Searching for tenant...</p>}
                  {foundTenant && (
                    <div className="space-y-2">
                      <div className="p-2 rounded-lg bg-success/10 text-success text-xs flex items-center gap-2">
                        <UserCheck className="w-3 h-4" /> Found: {foundTenant.full_name}
                      </div>
                      {checkingRent ? (
                         <p className="text-[10px] text-muted-foreground">Checking rent status...</p>
                      ) : lastRentStatus ? (
                        <div className={`p-2 rounded-lg text-xs flex items-center justify-between ${lastRentStatus.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                          <div className="flex items-center gap-2">
                            {lastRentStatus.status === "paid" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            <span>Rent for this month: {lastRentStatus.status === "paid" ? "Paid" : "Pending"}</span>
                          </div>
                          <span className="font-bold">₹{lastRentStatus.amount}</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">No rent records found for this month.</p>
                      )}
                    </div>
                  )}
                  {assignmentType === "new" && tenantEmail && !foundTenant && !searching && (
                    <div className="p-2 rounded-lg bg-warning/10 text-warning text-[10px] flex items-center gap-1.5">
                      <History className="w-3 h-3" /> They'll be automatically linked when they sign up.
                    </div>
                  )}
                  {assignmentType === "new" && (
                    <div className="space-y-2 mt-2">
                      <Label>Tenant Full Name *</Label>
                      <Input type="text" value={assignName} onChange={e => setAssignName(e.target.value)} placeholder="E.g. John Doe" required />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Property *</Label>
                  <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); setRoomId(""); setCustomRent(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>
                      {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room * {propertyId && `(${availableRoomsForProperty.length} available)`}</Label>
                  <Select value={roomId} onValueChange={handleRoomSelect} disabled={!propertyId}>
                    <SelectTrigger><SelectValue placeholder="Select room with available beds" /></SelectTrigger>
                    <SelectContent>
                      {availableRoomsForProperty.map(r => {
                        const active = getActiveCountForRoom(r.id);
                        const roomVacantBeds = allBeds.filter(b => b.room_id === r.id);
                        const sharingTypes = [...new Set(roomVacantBeds.map(b => b.sharing_type))];
                        const sharingInfo = sharingTypes.length > 0 ? ` · ${sharingTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")} vacant` : "";
                        return (
                          <SelectItem key={r.id} value={r.id}>
                            Room {r.room_number} ({r.capacity - active}/{r.capacity} beds free){sharingInfo}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {/* Bed selection — grouped by sharing type */}
                {vacantBedsForRoom.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Bed * ({vacantBedsForRoom.length} vacant)</Label>
                    <Select value={bedId} onValueChange={handleBedSelect}>
                      <SelectTrigger><SelectValue placeholder="Choose a bed" /></SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const grouped: Record<string, BedOption[]> = {};
                          vacantBedsForRoom.forEach(b => {
                            if (!grouped[b.sharing_type]) grouped[b.sharing_type] = [];
                            grouped[b.sharing_type].push(b);
                          });
                          return Object.entries(grouped).map(([type, beds]) => (
                            <div key={type}>
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground capitalize border-b">{type} Sharing ({beds.length} bed{beds.length > 1 ? "s" : ""})</div>
                              {beds.map(b => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.bed_label ? `Bed ${b.bed_label}` : "Bed"} · ₹{Number(b.rent_amount).toLocaleString()}/mo
                                </SelectItem>
                              ))}
                            </div>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Move-in Date</Label>
                    <Input type="date" value={moveInDate} onChange={e => setMoveInDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input type="tel" value={assignPhone} onChange={e => setAssignPhone(e.target.value)} placeholder="+91 XXXXXXXXXX" />
                  </div>
                </div>
                  <div className="space-y-2">
                    <Label>Rent (₹)</Label>
                    <Input type="number" value={customRent} onChange={e => setCustomRent(e.target.value)} placeholder="Room default" />
                  </div>

                  {bedId && (() => {
                    const selectedBedConf = allBeds.find(b => b.id === bedId);
                    if (selectedBedConf && selectedBedConf.deposit_amount > 0) {
                      return (
                        <div className="space-y-2">
                          <Label>Security Deposit (₹{selectedBedConf.deposit_amount})</Label>
                          <Select value={depositStatus} onValueChange={(v: "pending" | "paid") => setDepositStatus(v)}>
                            <SelectTrigger><SelectValue placeholder="Deposit Status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid successfully</SelectItem>
                              <SelectItem value="pending">Pending (will log as Pending Deposit)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="flex items-center space-x-2 pt-2 col-span-2 bg-muted/30 p-2 rounded-lg border border-border">
                  <input
                    type="checkbox"
                    id="initialRentPaid"
                    checked={initialRentPaid}
                    onChange={e => setInitialRentPaid(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="initialRentPaid" className="text-xs cursor-pointer">
                    Mark current month rent as <strong>Paid</strong>?
                  </Label>
                </div>

                <Button type="submit" className="w-full gradient-primary" disabled={!tenantEmail || !propertyId || !roomId || assigning}>
                  {assigning ? "Assigning..." : "Assign Tenant"}
                </Button>
              </form>
              )}
            </DialogContent>
           </Dialog>
          </div>
        </div>

        {/* Search & Filter Bar */}
        {!loading && assignments.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by tenant name or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={filterPropertyId} onValueChange={setFilterPropertyId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <ArrowUpDown className="w-4 h-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A–Z</SelectItem>
                <SelectItem value="name-desc">Name Z–A</SelectItem>
                <SelectItem value="date-newest">Newest first</SelectItem>
                <SelectItem value="date-oldest">Oldest first</SelectItem>
                <SelectItem value="rent-high">Rent: High → Low</SelectItem>
                <SelectItem value="rent-low">Rent: Low → High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : assignments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tenants assigned</h3>
              <p className="text-muted-foreground">Click "Assign Tenant" to add tenants to rooms</p>
            </CardContent>
          </Card>
        ) : (() => {
          const query = searchQuery.toLowerCase().trim();
          const filtered = assignments.filter(a => {
            const matchesProperty = filterPropertyId === "all" || a.property_id === filterPropertyId;
            const matchesSearch = !query ||
              (a.profiles?.full_name || "").toLowerCase().includes(query) ||
              (a.profiles?.phone || "").toLowerCase().includes(query);
            return matchesProperty && matchesSearch;
          });
          const sortFn = (a: TenantAssignment, b: TenantAssignment) => {
            switch (sortBy) {
              case "name-desc": return (b.profiles?.full_name || "").localeCompare(a.profiles?.full_name || "");
              case "date-newest": return new Date(b.move_in_date).getTime() - new Date(a.move_in_date).getTime();
              case "date-oldest": return new Date(a.move_in_date).getTime() - new Date(b.move_in_date).getTime();
              case "rent-high": return getTenantRent(b) - getTenantRent(a);
              case "rent-low": return getTenantRent(a) - getTenantRent(b);
              default: return (a.profiles?.full_name || "").localeCompare(b.profiles?.full_name || "");
            }
          };
          const activeTenants = filtered.filter(a => a.is_active).sort(sortFn);
          const movedOutTenants = filtered.filter(a => !a.is_active).sort(sortFn);

          const TenantCard = ({ a }: { a: TenantAssignment }) => (
            <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(a)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                       {a.tenant_id ? (
                        <UserCheck className="w-5 h-5 text-primary" />
                      ) : (
                        <History className="w-5 h-5 text-warning" />
                      )}
                      {a.profiles?.full_name || a.tenant_email || "Unknown Tenant"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {a.profiles?.phone || (a.tenant_id ? "No phone" : "Pending Registration")}
                    </p>
                  </div>
                  <Badge variant={a.is_active ? "default" : "secondary"} className={a.is_active ? "bg-success" : ""}>
                    {a.is_active ? "Active" : "Moved Out"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Property:</span> {(a as any).properties?.name}</p>
                <p><span className="text-muted-foreground">Room:</span> {(a as any).rooms?.room_number}</p>
                <p><span className="text-muted-foreground">{a.is_active ? "Move-in:" : "Moved out:"}</span> {a.is_active ? a.move_in_date : a.move_out_date || a.move_in_date}</p>
                <p className="flex items-center gap-1 font-semibold">
                  <IndianRupee className="w-3 h-3" />
                  {Number(getTenantRent(a)).toLocaleString()}/month
                </p>
                {a.id_proof_type && (
                  <p className="flex items-center gap-1"><Shield className="w-3 h-3 text-primary" /> {a.id_proof_type}: {a.id_proof_number}</p>
                )}
              </CardContent>
            </Card>
          );

          return (
            <Tabs defaultValue="active" className="space-y-4">
              <TabsList>
                <TabsTrigger value="active" className="gap-2">
                  <UserCheck className="w-4 h-4" /> Active
                  <Badge variant="secondary" className="ml-1 text-xs">{activeTenants.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="moved-out" className="gap-2">
                  <UserX className="w-4 h-4" /> Moved Out
                  <Badge variant="secondary" className="ml-1 text-xs">{movedOutTenants.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {activeTenants.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                      <Users className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No active tenants</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeTenants.map(a => <TenantCard key={a.id} a={a} />)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="moved-out">
                {movedOutTenants.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                      <UserX className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No moved-out tenants</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {movedOutTenants.map(a => <TenantCard key={a.id} a={a} />)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          );
        })()}

        {/* Tenant Detail Dialog */}
        <Dialog open={!!detailTenant} onOpenChange={(o) => { if (!o) setDetailTenant(null); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                {detailTenant?.profiles?.full_name || "Tenant Details"}
              </DialogTitle>
            </DialogHeader>

            {detailTenant && (
              <div className="space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Property</span>
                    <span className="font-medium">{(detailTenant as any).properties?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Room</span>
                    <span className="font-medium">{(detailTenant as any).rooms?.room_number}</span>
                  </div>
                   <div>
                     <span className="text-muted-foreground block">Name</span>
                     <Input className="h-8 text-sm" value={tenantName} onChange={e => setTenantName(e.target.value)} placeholder="Full Name" />
                   </div>
                   <div>
                     <span className="text-muted-foreground block">Phone</span>
                     <Input className="h-8 text-sm" value={tenantPhone} onChange={e => setTenantPhone(e.target.value)} placeholder="+91 XXXXXXXXXX" />
                   </div>
                  <div>
                    <span className="text-muted-foreground block">Move-in</span>
                    <span className="font-medium">{detailTenant.move_in_date}</span>
                  </div>
                </div>

                <Separator />

                {/* Rent */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" /> Monthly Rent
                  </Label>
                  <Input
                    type="number"
                    className="h-9"
                    value={detailRent}
                    onChange={e => setDetailRent(e.target.value)}
                    placeholder={`Room default: ₹${(detailTenant as any).rooms?.rent_amount ?? 0}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Room default: ₹{Number((detailTenant as any).rooms?.rent_amount ?? 0).toLocaleString()}. Set a custom amount to override.
                  </p>
                  <Textarea
                    value={rentChangeNote}
                    onChange={e => setRentChangeNote(e.target.value)}
                    placeholder="Reason for rent change (e.g. AC added, early payment discount)..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                {/* Rent History */}
                {rentHistory.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                      <History className="w-4 h-4 text-primary" /> Rent History
                    </h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {rentHistory.map(h => (
                        <div key={h.id} className="p-2 rounded-lg bg-muted/50 text-xs space-y-0.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-muted-foreground">₹{Number(h.old_rent ?? 0).toLocaleString()}</span>
                              <span className="mx-1.5">→</span>
                              <span className="font-semibold">₹{Number(h.new_rent).toLocaleString()}</span>
                            </div>
                            <span className="text-muted-foreground">{new Date(h.changed_at).toLocaleDateString()}</span>
                          </div>
                          {h.notes && <p className="text-muted-foreground italic">{h.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* ID Proof */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-primary" /> ID Proof
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">ID Type</Label>
                      <Select value={idProofType} onValueChange={setIdProofType}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aadhar">Aadhar Card</SelectItem>
                          <SelectItem value="pan">PAN Card</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="driving_license">Driving License</SelectItem>
                          <SelectItem value="voter_id">Voter ID</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ID Number</Label>
                      <Input className="h-9" value={idProofNumber} onChange={e => setIdProofNumber(e.target.value)} placeholder="XXXX-XXXX-XXXX" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Emergency Contact */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-primary" /> Emergency Contact
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input className="h-9" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="Contact name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input className="h-9" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="+91..." />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-xs">Notes</Label>
                  <Textarea value={tenantNotes} onChange={e => setTenantNotes(e.target.value)} placeholder="Any notes about the tenant..." rows={2} />
                </div>

                <Button onClick={saveDetails} disabled={savingDetails} className="w-full gradient-primary" size="sm">
                  {savingDetails ? "Saving..." : "Save Details"}
                </Button>

                <Separator />

                {/* Documents */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-primary" /> Documents
                  </h4>
                  <div className="space-y-2">
                    {documents.length > 0 ? documents.map(doc => (
                      <div key={doc.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                        <span className="truncate flex-1">{doc.name.split("_").slice(1).join("_") || doc.name}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadDoc(doc.name)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    )) : (
                      <p className="text-xs text-muted-foreground">No documents uploaded yet</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="doc-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                        <Upload className="w-4 h-4" />
                        {uploading ? "Uploading..." : "Upload document (ID proof, agreement, etc.)"}
                      </div>
                    </Label>
                    <input id="doc-upload" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleDocUpload} disabled={uploading} />
                  </div>
                </div>

                {detailTenant.is_active && (
                  <>
                    <Separator />

                    {/* Transfer & Swap */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <ArrowLeftRight className="w-4 h-4 text-primary" /> Room Transfer / Swap
                      </h4>

                      {/* Transfer to different room */}
                      {!transferOpen && !swapOpen && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => {
                            setTransferPropertyId(detailTenant.property_id);
                            setTransferRoomId("");
                            setTransferOpen(true);
                          }}>
                            <MoveRight className="w-3.5 h-3.5" /> Transfer Room
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => {
                            setSwapTargetId("");
                            setSwapOpen(true);
                          }}>
                            <ArrowLeftRight className="w-3.5 h-3.5" /> Swap Tenants
                          </Button>
                        </div>
                      )}

                      {/* Transfer Form */}
                      {transferOpen && (
                        <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium">Transfer to a new room</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTransferOpen(false)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Property</Label>
                            <Select value={transferPropertyId} onValueChange={(v) => { setTransferPropertyId(v); setTransferRoomId(""); }}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="Select property" /></SelectTrigger>
                              <SelectContent>
                                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">New Room ({transferAvailableRooms.length} available)</Label>
                            <Select value={transferRoomId} onValueChange={setTransferRoomId}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="Select room" /></SelectTrigger>
                              <SelectContent>
                                {transferAvailableRooms.map(r => {
                                  const active = getActiveCountForRoom(r.id);
                                  return (
                                    <SelectItem key={r.id} value={r.id}>
                                      Room {r.room_number} ({active}/{r.capacity} occupied) – ₹{Number(r.rent_amount).toLocaleString()}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button size="sm" className="w-full gradient-primary" disabled={!transferRoomId || transferring} onClick={handleTransfer}>
                            {transferring ? "Transferring..." : "Confirm Transfer"}
                          </Button>
                        </div>
                      )}

                      {/* Swap Form */}
                      {swapOpen && (
                        <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium">Swap with another tenant</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSwapOpen(false)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Select tenant to swap with</Label>
                            <Select value={swapTargetId} onValueChange={setSwapTargetId}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="Choose tenant" /></SelectTrigger>
                              <SelectContent>
                                {swappableTenants.map(a => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.profiles?.full_name || "Unknown"} – {(a as any).properties?.name}, Room {(a as any).rooms?.room_number}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {swapTargetId && (() => {
                            const target = assignments.find(a => a.id === swapTargetId);
                            if (!target) return null;
                            return (
                              <div className="text-xs text-muted-foreground p-2 rounded bg-muted/50 space-y-0.5">
                                <p><strong>{detailTenant.profiles?.full_name}</strong> → {(target as any).properties?.name}, Room {(target as any).rooms?.room_number}</p>
                                <p><strong>{target.profiles?.full_name}</strong> → {(detailTenant as any).properties?.name}, Room {(detailTenant as any).rooms?.room_number}</p>
                              </div>
                            );
                          })()}
                          <Button size="sm" className="w-full gradient-primary" disabled={!swapTargetId || swapping} onClick={handleSwap}>
                            {swapping ? "Swapping..." : "Confirm Swap"}
                          </Button>
                        </div>
                      )}
                    </div>

                    <Separator />
                    <Button variant="outline" size="sm" className="w-full text-destructive" onClick={() => handleDeactivate(detailTenant.id, detailTenant.room_id)}>
                      Mark as Moved Out
                    </Button>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Tenants;

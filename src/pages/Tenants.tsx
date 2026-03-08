import { useEffect, useState, useCallback } from "react";
import { Users, Plus, UserCheck, Search, Upload, FileText, Phone, Shield, X, Eye, IndianRupee, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

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
  rooms?: { room_number: string; rent_amount: number };
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

const Tenants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<TenantAssignment[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<RoomWithCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailTenant, setDetailTenant] = useState<TenantAssignment | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [rentHistory, setRentHistory] = useState<{ id: string; old_rent: number | null; new_rent: number; changed_at: string; notes: string | null }[]>([]);
  const [tenantLimit, setTenantLimit] = useState(5);

  // Form - assign
  const [tenantEmail, setTenantEmail] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split("T")[0]);
  const [customRent, setCustomRent] = useState("");
  const [assignPhone, setAssignPhone] = useState("");
  const [foundTenant, setFoundTenant] = useState<{ user_id: string; full_name: string } | null>(null);
  const [searching, setSearching] = useState(false);

  // Form - detail edit
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [idProofType, setIdProofType] = useState("");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [tenantNotes, setTenantNotes] = useState("");
  const [detailRent, setDetailRent] = useState("");
  const [rentChangeNote, setRentChangeNote] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [assignRes, propRes, roomRes, subRes] = await Promise.all([
      supabase.from("tenant_assignments").select("*, rooms(room_number, rent_amount), properties(name)").order("created_at", { ascending: false }),
      supabase.from("properties").select("id, name").eq("owner_id", user.id),
      supabase.from("rooms").select("id, room_number, property_id, capacity, rent_amount, is_vacant"),
      supabase.from("subscriptions").select("*, subscription_plans(tenant_limit)").eq("user_id", user.id).eq("status", "active").maybeSingle(),
    ]);

    const data = assignRes.data ?? [];
    const tenantIds = [...new Set(data.map(a => a.tenant_id))];
    let profilesMap: Record<string, { full_name: string; phone: string | null }> = {};
    if (tenantIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", tenantIds);
      profiles?.forEach(p => { profilesMap[p.user_id] = p; });
    }

    setAssignments(data.map(a => ({ ...a, profiles: profilesMap[a.tenant_id] })));
    setProperties(propRes.data ?? []);
    setRooms(roomRes.data ?? []);

    // Set tenant limit from subscription
    const limit = (subRes.data as any)?.subscription_plans?.tenant_limit;
    setTenantLimit(limit !== undefined && limit !== null ? limit : 5);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

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
    const room = rooms.find(r => r.id === rId);
    if (room) {
      setCustomRent(String(room.rent_amount));
    }
  };

  const searchTenant = async () => {
    if (!tenantEmail.trim()) return;
    setSearching(true);
    setFoundTenant(null);
    const { data, error } = await supabase.rpc("find_user_by_email", { _email: tenantEmail.trim() });
    if (error || !data || data.length === 0) {
      toast({ title: "Tenant not found", description: "No account found with this email.", variant: "destructive" });
    } else {
      setFoundTenant(data[0]);
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
    if (!user || !foundTenant || !propertyId || !roomId) return;

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

    const { error } = await supabase.from("tenant_assignments").insert({
      tenant_id: foundTenant.user_id,
      property_id: propertyId,
      room_id: roomId,
      move_in_date: moveInDate,
      custom_rent: rentValue,
    });

    // Save phone number to tenant profile
    if (!error && assignPhone.trim()) {
      await supabase.from("profiles").update({ phone: assignPhone.trim() }).eq("user_id", foundTenant.user_id);
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setAssigning(false);
      return;
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
    setCustomRent(""); setAssignPhone(""); setFoundTenant(null);
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
    setTenantPhone(a.profiles?.phone ?? "");
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
    }).eq("id", detailTenant.id);

    // Update tenant phone in profiles
    if (!error && tenantPhone !== (detailTenant.profiles?.phone ?? "")) {
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

  const getTenantRent = (a: TenantAssignment) => {
    return a.custom_rent ?? (a as any).rooms?.rent_amount ?? 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tenants</h1>
            <p className="text-muted-foreground">Manage tenant assignments and details</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2"><Plus className="w-4 h-4" /> Assign Tenant</Button>
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
                <div className="space-y-2">
                  <Label>Tenant Email *</Label>
                  <div className="flex gap-2">
                    <Input type="email" value={tenantEmail} onChange={e => setTenantEmail(e.target.value)} placeholder="tenant@example.com" required />
                    <Button type="button" variant="outline" onClick={searchTenant} disabled={searching}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {foundTenant && (
                    <div className="p-2 rounded-lg bg-success/10 text-success text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4" /> Found: {foundTenant.full_name}
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
                        return (
                          <SelectItem key={r.id} value={r.id}>
                            Room {r.room_number} ({active}/{r.capacity} occupied)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Move-in Date</Label>
                    <Input type="date" value={moveInDate} onChange={e => setMoveInDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rent (₹)</Label>
                    <Input type="number" value={customRent} onChange={e => setCustomRent(e.target.value)} placeholder="Room default" />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={!foundTenant || !propertyId || !roomId || assigning}>
                  {assigning ? "Assigning..." : "Assign Tenant"}
                </Button>
              </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map(a => (
              <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(a)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-primary" />
                        {a.profiles?.full_name || "Unknown Tenant"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{a.profiles?.phone || "No phone"}</p>
                    </div>
                    <Badge variant={a.is_active ? "default" : "secondary"} className={a.is_active ? "bg-success" : ""}>
                      {a.is_active ? "Active" : "Moved Out"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Property:</span> {(a as any).properties?.name}</p>
                  <p><span className="text-muted-foreground">Room:</span> {(a as any).rooms?.room_number}</p>
                  <p><span className="text-muted-foreground">Move-in:</span> {a.move_in_date}</p>
                  <p className="flex items-center gap-1 font-semibold">
                    <IndianRupee className="w-3 h-3" />
                    {Number(getTenantRent(a)).toLocaleString()}/month
                  </p>
                  {a.id_proof_type && (
                    <p className="flex items-center gap-1"><Shield className="w-3 h-3 text-primary" /> {a.id_proof_type}: {a.id_proof_number}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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

import { useEffect, useState } from "react";
import { Plus, Home, Pencil, Trash2, IndianRupee, Bed, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import OverLimitBanner from "@/components/OverLimitBanner";

interface BedInfo {
  id: string;
  bed_label: string;
  sharing_type: string;
  rent_amount: number;
  deposit_amount: number;
  is_vacant: boolean;
}

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  rent_amount: number;
  deposit_amount: number | null;
  is_vacant: boolean;
  amenities: string[];
  property_id: string;
  properties?: { name: string };
}

interface Property {
  id: string;
  name: string;
}

// Form bed entry (for add/edit dialog)
interface BedFormEntry {
  id?: string; // existing bed id (for editing)
  label: string;
  sharing_type: string;
  rent_amount: string;
  deposit_amount: string;
}

// Sharing section for advanced mode
interface SharingSection {
  enabled: boolean;
  rent: string;
  deposit: string;
}

const SHARING_BED_COUNT: Record<string, number> = { single: 1, double: 2, triple: 3 };
const SHARING_LABELS: Record<string, string> = { single: "Single Sharing", double: "Double Sharing", triple: "Triple Sharing" };
const SHARING_DESC: Record<string, string> = { single: "1 bed", double: "2 beds", triple: "3 beds" };

const Rooms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { effectiveOwnerId, isStaff, accessiblePropertyIds, loading: staffLoading } = useStaffAccess();
  const { isOverLimit, isBedLimitReached, tenantCount, bedCount, limits } = useSubscriptionGuard();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bedsMap, setBedsMap] = useState<Record<string, BedInfo[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [filterProperty, setFilterProperty] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [roomMode, setRoomMode] = useState<"simple" | "advanced">("simple");

  // Room form
  const [propertyId, setPropertyId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  // Beds form (still used internally to track existing bed IDs for editing)
  const [bedEntries, setBedEntries] = useState<BedFormEntry[]>([
    { label: "", sharing_type: "single", rent_amount: "", deposit_amount: "" }
  ]);

  // Simple mode fields
  const [simpleSharing, setSimpleSharing] = useState("single");
  const [simpleCapacity, setSimpleCapacity] = useState("1");
  const [simpleRent, setSimpleRent] = useState("");
  const [simpleDeposit, setSimpleDeposit] = useState("");

  // Advanced mode: sharing sections
  const [sharingSections, setSharingSections] = useState<Record<string, SharingSection>>({
    single: { enabled: false, rent: "", deposit: "" },
    double: { enabled: false, rent: "", deposit: "" },
    triple: { enabled: false, rent: "", deposit: "" },
  });

  const fetchData = async () => {
    if (!effectiveOwnerId) return;
    const [propRes, roomRes, bedRes] = await Promise.all([
      supabase.from("properties").select("id, name").eq("owner_id", effectiveOwnerId),
      supabase.from("rooms").select("*, properties(name)").order("created_at", { ascending: false }),
      supabase.from("beds").select("*").order("bed_label", { ascending: true }),
    ]);
    let fetchedProps = propRes.data ?? [];
    let fetchedRooms = roomRes.data ?? [];
    // Staff can only see their assigned properties
    if (isStaff && accessiblePropertyIds.length > 0) {
      fetchedProps = fetchedProps.filter(p => accessiblePropertyIds.includes(p.id));
      fetchedRooms = fetchedRooms.filter((r: any) => accessiblePropertyIds.includes(r.property_id));
    }
    setProperties(fetchedProps);
    setRooms(fetchedRooms);

    // Build beds map grouped by room_id
    const map: Record<string, BedInfo[]> = {};
    (bedRes.data ?? []).forEach((b: any) => {
      if (!map[b.room_id]) map[b.room_id] = [];
      map[b.room_id].push({
        id: b.id,
        bed_label: b.bed_label,
        sharing_type: b.sharing_type,
        rent_amount: Number(b.rent_amount),
        deposit_amount: Number(b.deposit_amount),
        is_vacant: b.is_vacant,
      });
    });
    setBedsMap(map);
    setLoading(false);
  };

  useEffect(() => { if (!staffLoading) fetchData(); }, [effectiveOwnerId, staffLoading]);

  const resetForm = () => {
    setPropertyId(""); setRoomNumber("");
    setBedEntries([{ label: "", sharing_type: "single", rent_amount: "", deposit_amount: "" }]);
    setEditingRoom(null);
    setRoomMode("simple");
    setSimpleSharing("single"); setSimpleCapacity("1"); setSimpleRent(""); setSimpleDeposit("");
    setSharingSections({
      single: { enabled: false, rent: "", deposit: "" },
      double: { enabled: false, rent: "", deposit: "" },
      triple: { enabled: false, rent: "", deposit: "" },
    });
  };

  const openEdit = (r: Room) => {
    setEditingRoom(r);
    setPropertyId(r.property_id);
    setRoomNumber(r.room_number);
    const roomBeds = bedsMap[r.id] ?? [];

    // Keep bed entries for tracking IDs during edit
    setBedEntries(roomBeds.map(b => ({
      id: b.id,
      label: b.bed_label,
      sharing_type: b.sharing_type,
      rent_amount: String(b.rent_amount),
      deposit_amount: String(b.deposit_amount),
    })));

    if (roomBeds.length > 0) {
      // Check if all beds have the same sharing type = simple mode
      const sharingTypes = new Set(roomBeds.map(b => b.sharing_type));
      const allSameRent = roomBeds.every(b => b.rent_amount === roomBeds[0].rent_amount);
      if (sharingTypes.size === 1 && allSameRent) {
        setRoomMode("simple");
        setSimpleSharing(roomBeds[0].sharing_type);
        setSimpleCapacity(String(roomBeds.length));
        setSimpleRent(String(roomBeds[0].rent_amount));
        setSimpleDeposit(String(roomBeds[0].deposit_amount));
      } else {
        // Advanced mode — populate sharing sections
        setRoomMode("advanced");
        const sections: Record<string, SharingSection> = {
          single: { enabled: false, rent: "", deposit: "" },
          double: { enabled: false, rent: "", deposit: "" },
          triple: { enabled: false, rent: "", deposit: "" },
        };
        for (const type of ["single", "double", "triple"]) {
          const bedsOfType = roomBeds.filter(b => b.sharing_type === type);
          if (bedsOfType.length > 0) {
            sections[type] = {
              enabled: true,
              rent: String(bedsOfType[0].rent_amount),
              deposit: String(bedsOfType[0].deposit_amount),
            };
          }
        }
        setSharingSections(sections);
      }
    } else {
      setRoomMode("simple");
      setSimpleSharing(r.room_type);
      setSimpleCapacity(String(r.capacity));
      setSimpleRent(String(r.rent_amount));
      setSimpleDeposit(String(r.deposit_amount ?? ""));
    }
    setDialogOpen(true);
  };

  const toggleSharingSection = (type: string) => {
    setSharingSections(prev => ({
      ...prev,
      [type]: { ...prev[type], enabled: !prev[type].enabled },
    }));
  };

  const updateSharingSection = (type: string, field: "rent" | "deposit", value: string) => {
    setSharingSections(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  // Build bed entries from sharing sections (for advanced mode)
  const buildBedsFromSections = (): BedFormEntry[] => {
    const beds: BedFormEntry[] = [];
    for (const type of ["single", "double", "triple"]) {
      const section = sharingSections[type];
      if (!section.enabled) continue;
      const count = SHARING_BED_COUNT[type];
      for (let i = 0; i < count; i++) {
        beds.push({
          label: `${type.charAt(0).toUpperCase()}${i + 1}`,
          sharing_type: type,
          rent_amount: section.rent,
          deposit_amount: section.deposit,
        });
      }
    }
    return beds;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!propertyId) {
      toast({ title: "Error", description: "Please select a property", variant: "destructive" });
      return;
    }

    let processedBeds: BedFormEntry[];

    if (roomMode === "simple") {
      if (!simpleRent) {
        toast({ title: "Error", description: "Please set the rent", variant: "destructive" });
        return;
      }
      const count = Math.max(1, parseInt(simpleCapacity) || 1);
      const labels = "ABCDEFGHIJKLMNOP";
      processedBeds = Array.from({ length: count }, (_, i) => ({
        label: count > 1 ? (labels[i] || String(i + 1)) : "",
        sharing_type: simpleSharing,
        rent_amount: simpleRent,
        deposit_amount: simpleDeposit,
      }));
    } else {
      // Advanced: build from sharing sections
      const enabledSections = Object.entries(sharingSections).filter(([, s]) => s.enabled);
      if (enabledSections.length === 0) {
        toast({ title: "Error", description: "Please enable at least one sharing type", variant: "destructive" });
        return;
      }
      const missingRent = enabledSections.find(([, s]) => !s.rent);
      if (missingRent) {
        toast({ title: "Error", description: `Please set the rent for ${SHARING_LABELS[missingRent[0]]}`, variant: "destructive" });
        return;
      }
      processedBeds = buildBedsFromSections();
    }
    setSubmitting(true);

    // Derive room-level fields from beds
    const capacity = processedBeds.length;
    const primaryType = processedBeds[0]?.sharing_type || "single";
    const primaryRent = parseFloat(processedBeds[0]?.rent_amount || "0");
    const primaryDeposit = parseFloat(processedBeds[0]?.deposit_amount || "0");

    const roomPayload = {
      property_id: propertyId,
      room_number: roomNumber,
      room_type: primaryType,
      capacity,
      rent_amount: primaryRent,
      deposit_amount: primaryDeposit,
    };

    let error;
    let roomId: string;

    if (editingRoom) {
      roomId = editingRoom.id;
      ({ error } = await supabase.from("rooms").update(roomPayload).eq("id", roomId));
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Delete beds that were removed in the form
      const existingBedIds = (bedsMap[roomId] ?? []).map(b => b.id);
      const keptBedIds = processedBeds.filter(b => b.id).map(b => b.id!);
      const toDelete = existingBedIds.filter(id => !keptBedIds.includes(id));
      if (toDelete.length > 0) {
        await supabase.from("beds").delete().in("id", toDelete);
      }

      // Upsert beds
      for (const bed of processedBeds) {
        if (bed.id) {
          await supabase.from("beds").update({
            bed_label: bed.label,
            sharing_type: bed.sharing_type,
            rent_amount: parseFloat(bed.rent_amount),
            deposit_amount: parseFloat(bed.deposit_amount || "0"),
          }).eq("id", bed.id);
        } else {
          await supabase.from("beds").insert({
            room_id: roomId,
            bed_label: bed.label,
            sharing_type: bed.sharing_type,
            rent_amount: parseFloat(bed.rent_amount),
            deposit_amount: parseFloat(bed.deposit_amount || "0"),
          });
        }
      }
    } else {
      // Create new room
      const { data: newRoom, error: insertErr } = await supabase.from("rooms").insert(roomPayload).select("id").single();
      if (insertErr || !newRoom) {
        toast({ title: "Error", description: insertErr?.message || "Failed to create room", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      roomId = newRoom.id;

      // Create beds
      const bedInserts = processedBeds.map(b => ({
        room_id: roomId,
        bed_label: b.label,
        sharing_type: b.sharing_type,
        rent_amount: parseFloat(b.rent_amount),
        deposit_amount: parseFloat(b.deposit_amount || "0"),
      }));
      const { error: bedErr } = await supabase.from("beds").insert(bedInserts);
      if (bedErr) {
        toast({ title: "Warning", description: "Room created but beds could not be added: " + bedErr.message, variant: "destructive" });
      }
    }

    toast({ title: editingRoom ? "Room updated!" : "Room added!" });
    setDialogOpen(false); resetForm(); fetchData();
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (!error) { toast({ title: "Room deleted" }); fetchData(); }
  };

  const toggleExpand = (roomId: string) => {
    setExpandedRooms(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId); else next.add(roomId);
      return next;
    });
  };

  const filtered = filterProperty === "all" ? rooms : rooms.filter(r => r.property_id === filterProperty);

  const getRoomStats = (roomId: string) => {
    const beds = bedsMap[roomId] ?? [];
    const total = beds.length;
    const vacant = beds.filter(b => b.is_vacant).length;
    return { total, vacant, occupied: total - vacant };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Rooms & Beds</h1>
            <p className="text-muted-foreground">Manage rooms and individual beds across properties</p>
          </div>
          {isOverLimit && (
            <OverLimitBanner tenantCount={tenantCount} tenantLimit={limits.tenantLimit} planName={limits.name} />
          )}
          {isBedLimitReached && !isOverLimit && (
            <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm">
              <strong>Bed limit reached:</strong> You have {bedCount} beds across all properties (plan limit: {limits.tenantLimit}). Upgrade your plan to add more rooms.
            </div>
          )}
          <div className="flex items-center gap-3">
            <Select value={filterProperty} onValueChange={setFilterProperty}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by property" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary gap-2" disabled={isBedLimitReached}><Plus className="w-4 h-4" /> Add Room</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Property *</Label>
                      <Select value={propertyId} onValueChange={setPropertyId} required>
                        <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                        <SelectContent>
                          {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Room Number *</Label>
                      <Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="101" required />
                    </div>
                  </div>

                {/* Mode toggle */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Button
                      type="button"
                      variant={roomMode === "simple" ? "default" : "ghost"}
                      size="sm"
                      className={`flex-1 text-xs ${roomMode === "simple" ? "gradient-primary" : ""}`}
                      onClick={() => setRoomMode("simple")}
                    >
                      Simple
                    </Button>
                    <Button
                      type="button"
                      variant={roomMode === "advanced" ? "default" : "ghost"}
                      size="sm"
                      className={`flex-1 text-xs ${roomMode === "advanced" ? "gradient-primary" : ""}`}
                      onClick={() => setRoomMode("advanced")}
                    >
                      Multi-Sharing
                    </Button>
                  </div>

                  {roomMode === "simple" ? (
                    /* Simple mode: single sharing type + rent for whole room */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Sharing Type *</Label>
                          <Select value={simpleSharing} onValueChange={setSimpleSharing}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="double">Double</SelectItem>
                              <SelectItem value="triple">Triple</SelectItem>
                              <SelectItem value="dormitory">Dormitory</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Beds in Room</Label>
                          <Input type="number" min="1" max="20" value={simpleCapacity} onChange={e => setSimpleCapacity(e.target.value)} placeholder="1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Rent per Bed (₹) *</Label>
                          <Input type="number" value={simpleRent} onChange={e => setSimpleRent(e.target.value)} placeholder="8000" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Deposit per Bed (₹)</Label>
                          <Input type="number" value={simpleDeposit} onChange={e => setSimpleDeposit(e.target.value)} placeholder="0" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">All beds will have the same sharing type and price. Switch to Multi-Sharing for mixed types in one room.</p>
                    </div>
                  ) : (
                    /* Advanced mode: sharing section toggles */
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Select which sharing types this room has. Each type adds the corresponding number of beds automatically.</p>
                      {["single", "double", "triple"].map(type => {
                        const section = sharingSections[type];
                        const totalBeds = Object.entries(sharingSections).filter(([, s]) => s.enabled).reduce((sum, [t]) => sum + SHARING_BED_COUNT[t], 0);
                        return (
                          <div key={type} className={`rounded-lg border transition-all ${section.enabled ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}>
                            <button
                              type="button"
                              className="w-full flex items-center justify-between p-3"
                              onClick={() => toggleSharingSection(type)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  section.enabled ? "bg-primary border-primary text-white" : "border-muted-foreground"
                                }`}>
                                  {section.enabled && <span className="text-xs font-bold">✓</span>}
                                </div>
                                <span className="font-medium capitalize">{SHARING_LABELS[type]}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">{SHARING_DESC[type]}</Badge>
                            </button>
                            {section.enabled && (
                              <div className="px-3 pb-3 grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Rent per Bed (₹) *</Label>
                                  <Input
                                    type="number"
                                    className="h-8 text-sm"
                                    value={section.rent}
                                    onChange={e => updateSharingSection(type, "rent", e.target.value)}
                                    placeholder="8000"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Deposit per Bed (₹)</Label>
                                  <Input
                                    type="number"
                                    className="h-8 text-sm"
                                    value={section.deposit}
                                    onChange={e => updateSharingSection(type, "deposit", e.target.value)}
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {(() => {
                        const totalBeds = Object.entries(sharingSections).filter(([, s]) => s.enabled).reduce((sum, [t]) => sum + SHARING_BED_COUNT[t], 0);
                        const enabledTypes = Object.entries(sharingSections).filter(([, s]) => s.enabled).map(([t]) => SHARING_LABELS[t]);
                        return totalBeds > 0 ? (
                          <div className="p-2 rounded-md bg-muted text-xs text-muted-foreground">
                            <strong>Total: {totalBeds} beds</strong> ({enabledTypes.join(" + ")})
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <Button type="submit" className="w-full gradient-primary" disabled={submitting}>
                    {submitting ? (editingRoom ? "Updating..." : "Adding...") : (editingRoom ? "Update Room" : "Add Room")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Home className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
              <p className="text-muted-foreground">Add rooms to your properties</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(r => {
              const stats = getRoomStats(r.id);
              const beds = bedsMap[r.id] ?? [];
              const isExpanded = expandedRooms.has(r.id);

              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Room {r.room_number}</CardTitle>
                        <p className="text-sm text-muted-foreground">{(r as any).properties?.name}</p>
                      </div>
                      {stats.total === 0 ? (
                        <Badge variant="secondary">No beds</Badge>
                      ) : stats.vacant === stats.total ? (
                        <Badge variant="default" className="bg-success">{stats.total} Vacant</Badge>
                      ) : stats.vacant === 0 ? (
                        <Badge variant="secondary">{stats.total}/{stats.total} Full</Badge>
                      ) : (
                        <Badge variant="outline" className="border-warning text-warning">{stats.vacant}/{stats.total} Vacant</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Sharing type summary */}
                    {beds.length > 0 && (() => {
                      const sharingGroups: Record<string, { total: number; vacant: number; rent: number }> = {};
                      beds.forEach(b => {
                        if (!sharingGroups[b.sharing_type]) sharingGroups[b.sharing_type] = { total: 0, vacant: 0, rent: b.rent_amount };
                        sharingGroups[b.sharing_type].total++;
                        if (b.is_vacant) sharingGroups[b.sharing_type].vacant++;
                      });
                      return (
                        <div>
                          {/* Compact sharing summary */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {Object.entries(sharingGroups).map(([type, info]) => (
                              <Badge key={type} variant="outline" className={`text-[10px] capitalize ${info.vacant > 0 ? "border-success text-success" : "border-border text-muted-foreground"}`}>
                                {type}: {info.vacant}/{info.total} vacant
                              </Badge>
                            ))}
                          </div>
                          {/* Expandable bed list grouped by sharing type */}
                          <button
                            type="button"
                            className="flex items-center gap-1 text-sm text-primary hover:underline w-full"
                            onClick={() => toggleExpand(r.id)}
                          >
                            <Bed className="w-3.5 h-3.5" />
                            {beds.length} bed{beds.length > 1 ? "s" : ""} · View details
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 space-y-2">
                              {Object.entries(sharingGroups).map(([type]) => {
                                const typeBeds = beds.filter(b => b.sharing_type === type);
                                return (
                                  <div key={type}>
                                    <div className="text-xs font-semibold text-muted-foreground capitalize mb-1 flex items-center justify-between">
                                      <span>{type} Sharing</span>
                                      <span className="flex items-center gap-0.5"><IndianRupee className="w-2.5 h-2.5" />{Number(typeBeds[0].rent_amount).toLocaleString()}/bed</span>
                                    </div>
                                    <div className="space-y-1">
                                      {typeBeds.map(b => (
                                        <div key={b.id} className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${b.is_vacant ? "bg-success/10 border border-success/20" : "bg-muted border border-border"}`}>
                                          <span className="font-medium">
                                            {b.bed_label ? `Bed ${b.bed_label}` : "Bed"}
                                          </span>
                                          <Badge variant={b.is_vacant ? "default" : "secondary"} className={`text-[10px] px-1.5 py-0 ${b.is_vacant ? "bg-success" : ""}`}>
                                            {b.is_vacant ? "Vacant" : "Occupied"}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Price range */}
                    {beds.length > 0 && (
                      <div className="flex items-center gap-1 text-lg font-bold">
                        <IndianRupee className="w-4 h-4" />
                        {(() => {
                          const rents = beds.map(b => b.rent_amount);
                          const min = Math.min(...rents);
                          const max = Math.max(...rents);
                          return min === max
                            ? Number(min).toLocaleString()
                            : `${Number(min).toLocaleString()} – ${Number(max).toLocaleString()}`;
                        })()}
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(r)}>
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Rooms;

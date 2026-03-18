import { useEffect, useState } from "react";
import { Zap, Plus, Droplets, CheckCircle, Clock, Eye, Users, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface Bill {
  id: string;
  bill_type: string;
  tenant_id: string;
  previous_reading: number | null;
  current_reading: number | null;
  units_consumed: number | null;
  rate_per_unit: number;
  amount: number;
  bill_month: string;
  status: string;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  rooms?: { room_number: string };
  properties?: { name: string };
}

interface RoomInfo {
  room_id: string;
  property_id: string;
  tenant_id: string;
  rooms: { room_number: string } | null;
  properties: { name: string } | null;
}

const UtilityBills = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { effectiveOwnerId, isStaff, accessiblePropertyIds, loading: staffLoading } = useStaffAccess();
  const [bills, setBills] = useState<Bill[]>([]);
  const [tenants, setTenants] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState("all");

  // Form state
  const [billType, setBillType] = useState("electricity");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [prevReading, setPrevReading] = useState("");
  const [currReading, setCurrReading] = useState("");
  const [rate, setRate] = useState("8");
  const [billMonth, setBillMonth] = useState(new Date().toISOString().slice(0, 7));
  const [splitBill, setSplitBill] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!effectiveOwnerId) return;
    const [billRes, tenantRes] = await Promise.all([
      supabase.from("utility_bills").select("*, rooms(room_number), properties(name)").order("created_at", { ascending: false }),
      supabase.from("tenant_assignments")
        .select("tenant_id, room_id, property_id, rooms(room_number), properties(name)")
        .eq("is_active", true),
    ]);

    let fetchedBills = billRes.data ?? [];
    let fetchedTenants = tenantRes.data ?? [];

    if (isStaff && accessiblePropertyIds.length > 0) {
      fetchedBills = fetchedBills.filter(b => accessiblePropertyIds.includes(b.property_id));
      fetchedTenants = fetchedTenants.filter(t => accessiblePropertyIds.includes(t.property_id));
    }

    setBills(fetchedBills);
    setTenants(fetchedTenants as unknown as RoomInfo[]);
    setLoading(false);
  };

  useEffect(() => { if (!staffLoading) fetchData(); }, [effectiveOwnerId, staffLoading]);

  // Group tenants by room for split billing
  const roomGroups = tenants.reduce((acc, t) => {
    const key = `${t.property_id}-${t.room_id}`;
    if (!acc[key]) acc[key] = { ...t, tenantIds: [] };
    acc[key].tenantIds.push(t.tenant_id);
    return acc;
  }, {} as Record<string, RoomInfo & { tenantIds: string[] }>);

  const rooms = Object.values(roomGroups);

  const units = prevReading && currReading ? Math.max(0, Number(currReading) - Number(prevReading)) : 0;
  const totalAmount = units * Number(rate);
  const selectedRoomData = rooms.find(r => `${r.property_id}-${r.room_id}` === selectedRoom);
  const roommateCount = selectedRoomData?.tenantIds.length || 1;
  const perPersonAmount = splitBill ? Math.ceil(totalAmount / roommateCount) : totalAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomData || submitting) return;
    setSubmitting(true);

    const tenantsToCharge = splitBill ? selectedRoomData.tenantIds : [selectedRoomData.tenantIds[0]];

    const inserts = tenantsToCharge.map(tid => ({
      property_id: selectedRoomData.property_id,
      room_id: selectedRoomData.room_id,
      tenant_id: tid,
      bill_type: billType,
      previous_reading: Number(prevReading) || null,
      current_reading: Number(currReading) || null,
      units_consumed: units,
      rate_per_unit: Number(rate),
      amount: perPersonAmount,
      bill_month: billMonth,
    }));

    const { error } = await supabase.from("utility_bills").insert(inserts);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Bill generated for ${tenantsToCharge.length} tenant(s)!` });
      setDialogOpen(false);
      setPrevReading(""); setCurrReading("");
      fetchData();
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("utility_bills").update({ status }).eq("id", id);
    toast({ title: `Bill marked as ${status}` });
    fetchData();
  };

  const pendingApproval = bills.filter(b => b.proof_url && b.status === "pending");
  const filteredBills = tab === "approval" ? pendingApproval : tab === "pending" ? bills.filter(b => b.status === "pending") : tab === "paid" ? bills.filter(b => b.status === "paid") : bills;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Utility Bills</h1>
            <p className="text-muted-foreground">Track meter readings, generate & approve bills</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <Plus className="w-4 h-4" /> Generate Bill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Utility Bill</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Bill Type</Label>
                  <Select value={billType} onValueChange={setBillType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electricity">⚡ Electricity</SelectItem>
                      <SelectItem value="water">💧 Water</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room *</Label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>
                      {rooms.map(r => (
                        <SelectItem key={`${r.property_id}-${r.room_id}`} value={`${r.property_id}-${r.room_id}`}>
                          {(r as any).properties?.name} · Room {(r as any).rooms?.room_number} ({r.tenantIds.length} tenant{r.tenantIds.length > 1 ? "s" : ""})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedRoomData && selectedRoomData.tenantIds.length > 1 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Split among {roommateCount} roommates</p>
                        <p className="text-xs text-muted-foreground">Each pays ₹{perPersonAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <Switch checked={splitBill} onCheckedChange={setSplitBill} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Bill Month</Label>
                  <Input type="month" value={billMonth} onChange={e => setBillMonth(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Previous Reading</Label>
                    <Input type="number" value={prevReading} onChange={e => setPrevReading(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Reading</Label>
                    <Input type="number" value={currReading} onChange={e => setCurrReading(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rate per Unit (₹)</Label>
                  <Input type="number" value={rate} onChange={e => setRate(e.target.value)} />
                </div>
                {units > 0 && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm space-y-1">
                    <p>Units consumed: <strong>{units}</strong></p>
                    <p>Total: <strong>₹{totalAmount.toLocaleString()}</strong></p>
                    {splitBill && roommateCount > 1 && (
                      <p>Per person: <strong>₹{perPersonAmount.toLocaleString()}</strong> × {roommateCount}</p>
                    )}
                  </div>
                )}
                <Button type="submit" className="w-full gradient-primary" disabled={submitting}>
                  {submitting ? "Generating..." : `Generate Bill${splitBill && roommateCount > 1 ? ` (${roommateCount} tenants)` : ""}`}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending approval alert */}
        {pendingApproval.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center justify-between py-3">
              <p className="text-sm font-medium">{pendingApproval.length} bill{pendingApproval.length > 1 ? "s" : ""} with payment proof awaiting your approval</p>
              <Button size="sm" variant="outline" onClick={() => setTab("approval")}>Review Now</Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All ({bills.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({bills.filter(b => b.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="approval">Approval ({pendingApproval.length})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({bills.filter(b => b.status === "paid").length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filteredBills.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bills here</h3>
              <p className="text-muted-foreground">{tab === "approval" ? "No bills awaiting approval" : "Generate bills by entering meter readings"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBills.map(b => (
              <Card key={b.id} className={b.proof_url && b.status === "pending" ? "border-warning/40" : ""}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {b.bill_type === "water" ? <Droplets className="w-5 h-5 text-primary" /> : <Zap className="w-5 h-5 text-warning" />}
                      <div>
                        <p className="font-medium capitalize">{b.bill_type} · {b.bill_month}</p>
                        <p className="text-sm text-muted-foreground">
                          {(b as any).properties?.name} · Room {(b as any).rooms?.room_number}
                          {b.units_consumed != null && ` · ${b.units_consumed} units`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold flex items-center gap-0.5 justify-end">
                        <IndianRupee className="w-3 h-3" />{Number(b.amount).toLocaleString()}
                      </p>
                      <Badge className={b.status === "paid" ? "bg-success" : "bg-warning"}>{b.status}</Badge>
                    </div>
                  </div>

                  {/* Proof + approval actions */}
                  {b.proof_url && (
                    <div className="flex items-center gap-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-sm flex-1">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-muted-foreground">Payment proof uploaded</span>
                        <a href={b.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View
                        </a>
                      </div>
                      {b.status === "pending" && (
                        <Button size="sm" className="bg-success hover:bg-success/90 gap-1" onClick={() => updateStatus(b.id, "paid")}>
                          <CheckCircle className="w-3 h-3" /> Approve & Mark Paid
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Manual status toggle for bills without proof */}
                  {!b.proof_url && b.status === "pending" && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "paid")}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Mark as Paid
                      </Button>
                    </div>
                  )}
                  {b.status === "paid" && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => updateStatus(b.id, "pending")}>
                        <Clock className="w-3 h-3 mr-1" /> Revert to Pending
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UtilityBills;

import { useEffect, useState } from "react";
import { CreditCard, IndianRupee, CheckCircle, Clock, AlertTriangle, Plus, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import OverLimitBanner from "@/components/OverLimitBanner";

interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  month: string;
  status: string;
  payment_date: string | null;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  rooms?: { room_number: string };
  properties?: { name: string };
  tenant_phone?: string | null;
  tenant_name?: string | null;
}

interface ActiveAssignment {
  id: string;
  tenant_id: string;
  property_id: string;
  room_id: string;
  rooms: { room_number: string; rent_amount: number } | null;
  properties: { name: string } | null;
  profiles?: { full_name: string };
}

const Payments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isReadOnly, isOverLimit, tenantCount, limits } = useSubscriptionGuard();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assignments, setAssignments] = useState<ActiveAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [amount, setAmount] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [payRes, assignRes] = await Promise.all([
      supabase.from("rent_payments").select("*, rooms(room_number), properties(name)").order("created_at", { ascending: false }),
      supabase.from("tenant_assignments").select("id, tenant_id, property_id, room_id, rooms(room_number, rent_amount), properties(name)").eq("is_active", true),
    ]);

    const payData = payRes.data ?? [];
    const assignData = assignRes.data ?? [];
    
    // Fetch tenant names and phones for both payments and assignments
    const allTenantIds = [...new Set([
      ...payData.map(p => p.tenant_id),
      ...assignData.map(a => a.tenant_id),
    ])];
    let profilesMap: Record<string, { full_name: string; phone: string | null }> = {};
    if (allTenantIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", allTenantIds);
      profiles?.forEach(p => { profilesMap[p.user_id] = p; });
    }

    setPayments(payData.map(p => ({
      ...p,
      tenant_name: profilesMap[p.tenant_id]?.full_name || null,
      tenant_phone: profilesMap[p.tenant_id]?.phone || null,
    })));
    setAssignments(assignData.map(a => ({ ...a, profiles: profilesMap[a.tenant_id] })) as ActiveAssignment[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleGenerate = async () => {
    if (!selectedAssignment || !month) return;
    setGenerating(true);

    const assign = assignments.find(a => a.id === selectedAssignment);
    if (!assign) { setGenerating(false); return; }

    // Check for duplicate
    const { count } = await supabase
      .from("rent_payments")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", assign.tenant_id)
      .eq("month", month);

    if ((count ?? 0) > 0) {
      toast({ title: "Already exists", description: `Rent for this tenant for ${month} has already been generated.`, variant: "destructive" });
      setGenerating(false);
      return;
    }

    const rentAmount = amount ? Number(amount) : Number(assign.rooms?.rent_amount ?? 0);

    const { error } = await supabase.from("rent_payments").insert({
      tenant_id: assign.tenant_id,
      property_id: assign.property_id,
      room_id: assign.room_id,
      amount: rentAmount,
      month,
      status: "pending",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rent record created!" });
      setDialogOpen(false);
      setSelectedAssignment("");
      setAmount("");
      fetchData();
    }
    setGenerating(false);
  };

  const handleGenerateAll = async () => {
    if (!month || assignments.length === 0) return;
    setGenerating(true);

    // Fetch existing payments for this month to avoid duplicates
    const tenantIds = assignments.map(a => a.tenant_id);
    const { data: existing } = await supabase
      .from("rent_payments")
      .select("tenant_id")
      .eq("month", month)
      .in("tenant_id", tenantIds);

    const existingTenantIds = new Set((existing ?? []).map(e => e.tenant_id));
    const newAssignments = assignments.filter(a => !existingTenantIds.has(a.tenant_id));

    if (newAssignments.length === 0) {
      toast({ title: "Already generated", description: `Rent for all tenants for ${month} has already been generated.`, variant: "destructive" });
      setGenerating(false);
      return;
    }

    const records = newAssignments.map(a => ({
      tenant_id: a.tenant_id,
      property_id: a.property_id,
      room_id: a.room_id,
      amount: Number(a.rooms?.rent_amount ?? 0),
      month,
      status: "pending",
    }));

    const { error } = await supabase.from("rent_payments").insert(records);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const skipped = assignments.length - newAssignments.length;
      const msg = skipped > 0
        ? `${records.length} rent records created for ${month} (${skipped} already existed, skipped).`
        : `${records.length} rent records created for ${month}!`;
      toast({ title: msg });
      setDialogOpen(false);
      fetchData();
    }
    setGenerating(false);
  };

  const markPaid = async (id: string) => {
    await supabase.from("rent_payments").update({
      status: "paid",
      payment_date: new Date().toISOString(),
    }).eq("id", id);
    toast({ title: "Marked as paid" });
    fetchData();
  };

  const statusIcon = (s: string) => {
    if (s === "paid") return <CheckCircle className="w-4 h-4 text-success" />;
    if (s === "overdue") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  const selectedAssign = assignments.find(a => a.id === selectedAssignment);

  const sendWhatsAppReminder = (payment: Payment) => {
    const phone = payment.tenant_phone?.replace(/[^0-9]/g, "");
    if (!phone) {
      toast({ title: "No phone number", description: "This tenant doesn't have a phone number on their profile.", variant: "destructive" });
      return;
    }
    const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const tenantName = payment.tenant_name || "Tenant";
    const propertyName = (payment as any).properties?.name || "your PG";
    const roomNumber = (payment as any).rooms?.room_number || "";
    const message = `Hi ${tenantName},\n\nThis is a friendly reminder that your rent of ₹${Number(payment.amount).toLocaleString()} for ${payment.month} (${propertyName}, Room ${roomNumber}) is pending.\n\nPlease make the payment at your earliest convenience.\n\nThank you!`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isOverLimit && (
          <OverLimitBanner tenantCount={tenantCount} tenantLimit={limits.tenantLimit} planName={limits.name} />
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Track and generate rent payments</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2" disabled={isReadOnly}><Plus className="w-4 h-4" /> Generate Rent</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Generate Rent Payment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Month *</Label>
                  <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Tenant (or leave empty to generate for all)</Label>
                  <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                    <SelectTrigger><SelectValue placeholder="All active tenants" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Active Tenants</SelectItem>
                      {assignments.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.profiles?.full_name || "Unknown"} — {(a.properties as any)?.name} Room {(a.rooms as any)?.room_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAssign && selectedAssignment !== "all" && (
                  <div className="space-y-2">
                    <Label>Amount (₹) — default: ₹{Number(selectedAssign.rooms?.rent_amount ?? 0).toLocaleString()}</Label>
                    <Input
                      type="number"
                      placeholder={String(selectedAssign.rooms?.rent_amount ?? 0)}
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  onClick={selectedAssignment === "all" || !selectedAssignment ? handleGenerateAll : handleGenerate}
                  className="w-full gradient-primary"
                  disabled={generating || !month}
                >
                  {generating ? "Generating..." : selectedAssignment === "all" || !selectedAssignment
                    ? `Generate for All (${assignments.length} tenants)`
                    : "Generate Rent Record"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : payments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payments recorded</h3>
              <p className="text-muted-foreground">Click "Generate Rent" to create monthly rent records</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {payments.map(p => (
              <Card key={p.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {statusIcon(p.status)}
                      <div>
                        <p className="font-medium">{(p as any).properties?.name} · Room {(p as any).rooms?.room_number}</p>
                        <p className="text-sm text-muted-foreground">{p.month}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />{Number(p.amount).toLocaleString()}
                        </p>
                        <Badge variant={p.status === "paid" ? "default" : p.status === "overdue" ? "destructive" : "secondary"} className={p.status === "paid" ? "bg-success" : ""}>
                          {p.status}
                        </Badge>
                      </div>
                      {p.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="gap-1 text-success border-success hover:bg-success/10" onClick={() => sendWhatsAppReminder(p)}>
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </Button>
                          <Button size="sm" className="gradient-primary" onClick={() => markPaid(p.id)}>
                            Mark Paid
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {(p as any).proof_url && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span>Payment proof uploaded</span>
                      <a href={(p as any).proof_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">View proof</a>
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

export default Payments;

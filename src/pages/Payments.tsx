import { useEffect, useState, useRef } from "react";
import { CreditCard, IndianRupee, CheckCircle, Clock, AlertTriangle, Plus, MessageCircle, FileText, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import OverLimitBanner from "@/components/OverLimitBanner";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { useWhatsAppNotify } from "@/hooks/useWhatsAppNotify";
import { useSubscriptionPlan } from "@/hooks/useSubscriptionPlan";

interface Payment {
  id: string;
  tenant_id: string | null;
  tenant_email?: string | null;
  amount: number;
  month: string;
  status: string;
  payment_date: string | null;
  payment_type?: string;
  payment_method?: string | null;
  transaction_id?: string | null;
  approved_by?: string | null;
  approved_by_name?: string | null;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  tenant_phone: string | null;
  property_id: string;
  room_id: string;
  rooms?: { room_number: string };
  properties?: { name: string };
  tenant_name?: string | null;
}

interface ActiveAssignment {
  id: string;
  tenant_id: string | null;
  tenant_email?: string | null;
  property_id: string;
  tenant_phone?: string | null;
  room_id: string;
  rooms: { room_number: string; rent_amount: number } | null;
  properties: { name: string } | null;
  profiles?: { full_name: string };
}

const Payments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { send: sendWhatsApp } = useWhatsAppNotify();
  const { canUseWhatsApp } = useSubscriptionPlan();
  const { isReadOnly, isOverLimit, bedCount, bedLimit, limits } = useSubscriptionGuard();
  const { effectiveOwnerId, isStaff, accessiblePropertyIds, loading: staffLoading } = useStaffAccess();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assignments, setAssignments] = useState<ActiveAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const hasAutoBilled = useRef(false);

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState<{ id: string; description: string; created_at: string; user_name: string }[]>([]);

  // Record Payment Dialog
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [recordingPaymentId, setRecordingPaymentId] = useState<string | null>(null);
  const [recordedAmount, setRecordedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [referenceNumber, setReferenceNumber] = useState("");

  // Action loading (approve/reject)
  const [actionLoading, setActionLoading] = useState(false);

  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>("all");

  // Form
  const [manualType, setManualType] = useState<"rent" | "deposit">("rent");
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [amount, setAmount] = useState("");

  const fetchData = async () => {
    if (!user || !effectiveOwnerId) return;
    const [payRes, assignRes, propRes] = await Promise.all([
      supabase.from("rent_payments").select("*, rooms(room_number), properties(name)").order("created_at", { ascending: false }),
      supabase.from("tenant_assignments").select("id, tenant_id, tenant_email, tenant_phone, property_id, room_id, rooms(room_number, rent_amount), properties(name)").eq("is_active", true),
      supabase.from("properties").select("id, name").eq("owner_id", effectiveOwnerId),
    ]);

    const payData = (payRes.data as any[]) ?? [];
    const assignData = (assignRes.data as any[]) ?? [];
    let propsData = (propRes.data as any[]) ?? [];
    
    // Fetch tenant names and phones for both payments and assignments
    const typedPayData = payData as any[];
    const typedAssignData = assignData as any[];
    const allTenantIds = [...new Set([
      ...typedPayData.map(p => p.tenant_id),
      ...typedAssignData.map(a => a.tenant_id)
    ])].filter(Boolean) as string[];

    let profilesMap: Record<string, any> = {};
    if (allTenantIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", allTenantIds as string[]);
      profiles?.forEach(p => { profilesMap[p.user_id] = p; });
    }

    // Resolve approved_by names
    const approverIds = [...new Set(typedPayData.map(p => p.approved_by).filter(Boolean))] as string[];
    let approverMap: Record<string, string> = {};
    if (approverIds.length > 0) {
      const { data: approverProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", approverIds);
      approverProfiles?.forEach(p => { approverMap[p.user_id] = p.full_name; });
    }

    let fetchedPayments = (payData as any[]).map((p: any) => ({
      ...p,
      tenant_name: p.tenant_name || (p.tenant_id ? profilesMap[p.tenant_id]?.full_name : null),
      tenant_phone: p.tenant_phone || (p.tenant_id ? profilesMap[p.tenant_id]?.phone : null),
      approved_by_name: p.approved_by ? approverMap[p.approved_by] || "Owner/Manager" : null,
    }));
    let fetchedAssignments = (assignData as any[]).map((a: any) => ({ 
      ...a, 
      profiles: a.tenant_id ? profilesMap[a.tenant_id] : null 
    })) as ActiveAssignment[];

    // Staff scoping
    if (isStaff && accessiblePropertyIds.length > 0) {
      fetchedPayments = fetchedPayments.filter(p => accessiblePropertyIds.includes(p.property_id));
      fetchedAssignments = fetchedAssignments.filter(a => accessiblePropertyIds.includes(a.property_id));
      propsData = propsData.filter(p => accessiblePropertyIds.includes(p.id));
      if (selectedPropertyFilter === "all" && propsData.length === 1) {
        setSelectedPropertyFilter(propsData[0].id);
      }
    }

    setProperties(propsData);
    setPayments(fetchedPayments);
    setAssignments(fetchedAssignments);

    // Fetch activity logs for rent_payments
    const { data: logData } = await (supabase as any)
      .from("audit_logs")
      .select("id, description, created_at, user_id")
      .eq("table_name", "rent_payments")
      .order("created_at", { ascending: false })
      .limit(50);

    if (logData) {
      // Resolve user names for log entries
      const logUserIds = [...new Set((logData as any[]).map((l: any) => l.user_id).filter(Boolean))] as string[];
      let logUserMap: Record<string, string> = {};
      if (logUserIds.length > 0) {
        const { data: logProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", logUserIds);
        logProfiles?.forEach(p => { logUserMap[p.user_id] = p.full_name; });
      }
      setActivityLogs((logData as any[]).map((l: any) => ({
        id: l.id,
        description: l.description,
        created_at: l.created_at,
        user_name: logUserMap[l.user_id] || "System",
      })));
    }
    
    // Trigger auto-billing in background only once per mount
    if (fetchedAssignments.length > 0 && !hasAutoBilled.current) {
      hasAutoBilled.current = true;
      autoBilling(fetchedAssignments, fetchedPayments);
    }
    
    setLoading(false);
  };

  const autoBilling = async (currentAssignments: any[], currentPayments: any[]) => {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    
    // Match payments by tenant_id OR tenant_email for the current month AND are rent types
    const existingForMonth = currentPayments.filter(p => p.month === currentMonth && p.payment_type !== "deposit");
    const existingTenantIds = new Set(existingForMonth.map(p => p.tenant_id).filter(Boolean));
    const existingEmails = new Set(existingForMonth.map(p => p.tenant_email).filter(Boolean));

    const missingAssignments = currentAssignments.filter(a => {
      // If we have a tenant_id, check by ID
      if (a.tenant_id && existingTenantIds.has(a.tenant_id)) return false;
      // If no ID or ID check passed, check by email
      if (a.tenant_email && existingEmails.has(a.tenant_email)) return false;
      return true;
    });

    if (missingAssignments.length === 0) return;

    // Generate records for missing ones
    const records = missingAssignments.map(a => ({
      tenant_id: a.tenant_id,
      tenant_email: a.tenant_email,
      tenant_phone: a.tenant_phone,
      property_id: a.property_id,
      room_id: a.room_id,
      amount: Number(a.rooms?.rent_amount ?? 0),
      month: currentMonth,
      status: "pending",
      payment_type: "rent",
    }));

    const { error } = await supabase.from("rent_payments").insert(records);
    if (!error) {
      // Re-fetch to show new records
      const { data: updatedPay } = await supabase.from("rent_payments").select("*, rooms(room_number), properties(name)").order("created_at", { ascending: false });
      if (updatedPay) {
        // Find existing profiles again (or rely on profilesMap from fetchData)
        setPayments(updatedPay.map(p => ({
          ...p,
          tenant_name: (p as any).tenant_name || (p.tenant_id ? (p as any).tenant_id : null), // simplified for quick update
          tenant_phone: (p as any).tenant_phone || null,
        })));
        // Full refresh to get proper names correctly mapped
        fetchData();
      }
    }
  };

  useEffect(() => { fetchData(); }, [user, staffLoading]);

  const handleGenerate = async () => {
    if (!selectedAssignment || !month) return;
    setGenerating(true);

    const assign = assignments.find(a => a.id === selectedAssignment);
    if (!assign) { setGenerating(false); return; }

    // For rent, check for duplicate month. Don't restrict duplicate deposits.
    if (manualType === "rent") {
      let query = (supabase as any)
        .from("rent_payments")
        .select("id", { count: "exact", head: true })
        .eq("month", month)
        .eq("payment_type", "rent");
      
      if (assign.tenant_id) {
        query = query.eq("tenant_id", assign.tenant_id);
      } else {
        query = query.eq("tenant_email", assign.tenant_email);
      }
      
      const { count } = await query;

      if ((count ?? 0) > 0) {
        toast({ title: "Already exists", description: `Rent for this tenant for ${month} has already been generated.`, variant: "destructive" });
        setGenerating(false);
        return;
      }
    }

    const rentAmount = amount ? Number(amount) : Number(assign.rooms?.rent_amount ?? 0);

    const { error: insertErr } = await supabase.from("rent_payments").insert({
      tenant_id: assign.tenant_id,
      tenant_email: assign.tenant_email,
      tenant_phone: assign.tenant_phone,
      property_id: assign.property_id,
      room_id: assign.room_id,
      amount: rentAmount,
      month,
      status: "pending",
      payment_type: manualType,
    });

    if (insertErr) {
      toast({ title: "Error", description: insertErr.message, variant: "destructive" });
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

    // Fetch existing payments for this month
    const tenantIds = assignments.map(a => a.tenant_id).filter(Boolean);
    const tenantEmails = assignments.map(a => a.tenant_email).filter(Boolean);
    
    const { data: existing } = await supabase
      .from("rent_payments")
      .select("tenant_id, tenant_email")
      .eq("month", month)
      .eq("payment_type", "rent");

    const existingRent = (existing as any[]) ?? [];
    const existingTenantIds = new Set(existingRent.map(e => e.tenant_id).filter(Boolean));
    const existingEmails = new Set(existingRent.map(e => e.tenant_email).filter(Boolean));
    
    const newAssignments = assignments.filter(a => {
      if (a.tenant_id) return !existingTenantIds.has(a.tenant_id);
      return !existingEmails.has(a.tenant_email);
    });

    if (newAssignments.length === 0) {
      toast({ title: "Already generated", description: `Rent for all tenants for ${month} has already been generated.`, variant: "destructive" });
      setGenerating(false);
      return;
    }

    const records = newAssignments.map(a => ({
      tenant_id: a.tenant_id,
      tenant_email: a.tenant_email,
      tenant_phone: a.tenant_phone,
      property_id: a.property_id,
      room_id: a.room_id,
      amount: Number(a.rooms?.rent_amount ?? 0),
      month,
      status: "pending",
      payment_type: "rent",
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

  const sendPaymentWhatsApp = (payment: Payment) => {
    if (!canUseWhatsApp("send-payment-received")) return;
    
    sendWhatsApp("send-payment-received", {
      tenant_phone: payment.tenant_phone,
      tenant_name: payment.tenant_name || "Tenant",
      amount: payment.amount,
      month: payment.month,
      property_name: (payment as any).properties?.name || "your PG",
      room_number: (payment as any).rooms?.room_number || "N/A",
      receipt_url: `${window.location.origin}/receipt/${payment.id}`,
      property_id: payment.property_id
    });
  };

  const markPaid = async (id: string) => {
    const payment = payments.find(p => p.id === id);
    const { error } = await supabase.from("rent_payments").update({
      status: "paid",
      payment_date: new Date().toISOString(),
    }).eq("id", id);
    
    if (!error) {
      toast({ title: "Marked as paid" });
      if (payment) sendPaymentWhatsApp(payment);
      fetchData();
    }
  };

  const approvePayment = async (payment: Payment) => {
    if (!user || actionLoading) return;
    setActionLoading(true);
    const { error } = await supabase.from("rent_payments").update({
      status: "paid",
      payment_date: new Date().toISOString(),
      approved_by: user.id,
      payment_method: "proof",
    }).eq("id", payment.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payment approved and marked as paid!" });
      sendPaymentWhatsApp(payment);
      fetchData();
    }
    setActionLoading(false);
  };

  const rejectPayment = async (paymentId: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    const { error } = await supabase.from("rent_payments").update({
      proof_url: null,
      proof_uploaded_at: null,
      transaction_id: null,
    }).eq("id", paymentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proof rejected", description: "The tenant can re-upload a new proof." });
      fetchData();
    }
    setActionLoading(false);
  };

  const submitRecordedPayment = async () => {
    if (!recordingPaymentId || !recordedAmount) return;
    setGenerating(true);
    const { error } = await supabase.from("rent_payments").update({
      status: "paid",
      payment_date: new Date().toISOString(),
      amount: Number(recordedAmount),
      payment_method: paymentMethod,
      transaction_id: referenceNumber || null,
    }).eq("id", recordingPaymentId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payment recorded successfully!" });
      const payment = payments.find(p => p.id === recordingPaymentId);
      if (payment) {
        sendPaymentWhatsApp({
          ...payment,
          amount: Number(recordedAmount),
          payment_method: paymentMethod,
          status: "paid",
          id: recordingPaymentId
        } as Payment);
      }
      setRecordPaymentOpen(false);
      fetchData();
    }
    setGenerating(false);
  };

  const statusIcon = (s: string) => {
    if (s === "paid") return <CheckCircle className="w-4 h-4 text-success" />;
    if (s === "overdue") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  const selectedAssign = assignments.find(a => a.id === selectedAssignment);

  const sendWhatsAppReminder = (payment: Payment) => {
    if (!canUseWhatsApp("send-rent-reminder")) {
      toast({ title: "Plan upgrade required", description: "WhatsApp reminders are available on Pro and Business plans.", variant: "destructive" });
      return;
    }

    sendWhatsApp("send-rent-reminder", {
      tenant_ids: payment.tenant_id ? [payment.tenant_id] : [],
      tenant_phone: payment.tenant_phone,
      property_name: (payment as any).properties?.name || "your PG",
      room_number: (payment as any).rooms?.room_number || "N/A",
      amount: payment.amount,
      month: payment.month,
    });
  };

  const filteredPayments = selectedPropertyFilter === "all" 
    ? payments 
    : payments.filter(p => p.property_id === selectedPropertyFilter);

  const pendingPayments = filteredPayments.filter(p => (p.status === "pending" || p.status === "overdue") && !p.proof_url);
  const approvalPayments = filteredPayments.filter(p => (p.status === "pending" || p.status === "overdue") && p.proof_url);
  const paidPayments = filteredPayments.filter(p => p.status === "paid");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isOverLimit && (
          <OverLimitBanner bedCount={bedCount} bedLimit={bedLimit} planName={limits.name} />
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Track and generate rent payments</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {!isStaff && properties.length > 0 && (
              <Select value={selectedPropertyFilter} onValueChange={setSelectedPropertyFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isStaff && properties.length === 1 && (
              <Badge variant="outline" className="h-10 px-3 flex items-center gap-1.5 whitespace-nowrap bg-muted/50 border-border">
                <span className="w-2 h-2 rounded-full bg-primary/80"></span>
                {properties[0].name}
              </Badge>
            )}
            <div className="flex gap-2">
              <Button onClick={() => fetchData()} variant="outline" size="icon" title="Refresh Billing">
                <Plus className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2" disabled={isReadOnly}><Plus className="w-4 h-4" /> Manual Entry</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Manual Payment Entry</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="flex p-1 bg-muted rounded-lg mb-4">
                      <button
                        type="button"
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${manualType === "rent" ? "bg-background shadow-sm" : "hover:text-primary"}`}
                        onClick={() => setManualType("rent")}
                      >
                        Monthly Rent
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${manualType === "deposit" ? "bg-background shadow-sm" : "hover:text-primary"}`}
                        onClick={() => setManualType("deposit")}
                      >
                        Security Deposit
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label>Month *</Label>
                      <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Tenant</Label>
                      <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                        <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                        <SelectContent>
                          {assignments.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.profiles?.full_name || a.tenant_email || "Pending Tenant"} — {(a.properties as any)?.name} Room {(a.rooms as any)?.room_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedAssign && (
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
                      onClick={handleGenerate}
                      className="w-full gradient-primary"
                      disabled={generating || !month || !selectedAssignment}
                    >
                      {generating ? "Saving..." : "Create Record"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filteredPayments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payments recorded</h3>
              <p className="text-muted-foreground">Click "Generate Rent" to create monthly rent records</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending <Badge variant="secondary" className="ml-1">{pendingPayments.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="approvals" className="flex items-center gap-2">
                Approvals <Badge variant="secondary" className="ml-1">{approvalPayments.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center gap-2">
                Paid <Badge variant="secondary" className="ml-1">{paidPayments.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-3.5 h-3.5" /> History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary/50" />
                  <p>All cleared! No pending payments.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayments.map(p => (
                    <Card key={p.id} className="border-warning/30 bg-warning/5">
                      <CardContent className="py-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {statusIcon(p.status)}
                            <div>
                              <p className="font-medium">{(p as any).properties?.name} · Room {(p as any).rooms?.room_number}</p>
                              <p className="text-sm font-medium">{p.tenant_name || p.tenant_email}</p>
                              <p className="text-xs text-muted-foreground">{p.month}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" />{Number(p.amount).toLocaleString()}
                              </p>
                              <Badge variant={p.status === "overdue" ? "destructive" : "secondary"}>
                                {p.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className="gap-1 text-success border-success hover:bg-success/10" onClick={() => sendWhatsAppReminder(p)}>
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </Button>
                              <Button size="sm" className="gradient-primary" onClick={() => {
                                setRecordingPaymentId(p.id);
                                setRecordedAmount(String(p.amount));
                                setPaymentMethod("upi");
                                setReferenceNumber("");
                                setRecordPaymentOpen(true);
                              }}>
                                Record Payment
                              </Button>
                            </div>
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
            </TabsContent>

            <TabsContent value="approvals">
              {approvalPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary/50" />
                  <p>No payments awaiting approval.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvalPayments.map(p => (
                    <Card key={p.id} className="border-primary/30 bg-primary/5">
                      <CardContent className="py-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">
                                {(p as any).properties?.name} · Room {(p as any).rooms?.room_number}
                                {p.payment_type === "deposit" && (
                                  <Badge variant="outline" className="ml-2 text-[10px] bg-primary/10 text-primary border-primary/20">Security Deposit</Badge>
                                )}
                              </p>
                              <p className="text-sm font-medium">{p.tenant_name || p.tenant_email}</p>
                              <p className="text-xs text-muted-foreground">{p.month}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold flex items-center gap-1 justify-end">
                              <IndianRupee className="w-3 h-3" />{Number(p.amount).toLocaleString()}
                            </p>
                            <Badge variant="secondary">Awaiting Approval</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 pt-3 border-t border-border">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span className="text-muted-foreground">Proof submitted</span>
                            <a href={p.proof_url!} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline">View Proof</a>
                          </div>
                          {p.transaction_id && (
                            <p className="text-xs text-muted-foreground"><strong>Ref No:</strong> {p.transaction_id}</p>
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive hover:bg-destructive/10" onClick={() => rejectPayment(p.id)} disabled={actionLoading}>
                            <AlertTriangle className="w-3.5 h-3.5" /> {actionLoading ? "..." : "Reject"}
                          </Button>
                          <Button size="sm" className="gradient-primary gap-1" onClick={() => approvePayment(p)} disabled={actionLoading}>
                            <CheckCircle className="w-3.5 h-3.5" /> {actionLoading ? "..." : "Approve & Mark Paid"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="paid">
              {paidPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No paid payments yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paidPayments.map(p => (
                    <Card key={p.id}>
                      <CardContent className="py-4 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            {statusIcon(p.status)}
                            <div>
                              <p className="font-medium">{(p as any).properties?.name} · Room {(p as any).rooms?.room_number}</p>
                              <p className="text-sm font-medium">{p.tenant_name || p.tenant_email}</p>
                              <p className="text-xs text-muted-foreground">{p.month}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                            <div className="text-left sm:text-right">
                              <p className="font-bold flex items-center gap-1 sm:justify-end">
                                <IndianRupee className="w-3 h-3" />{Number(p.amount).toLocaleString()}
                              </p>
                              <Badge variant="default" className="bg-success">
                                {p.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {(p.payment_method || p.transaction_id) && (
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-3 border-t border-border mt-3">
                            {p.payment_method && <p><strong>Method:</strong> <span className="uppercase">{p.payment_method.replace('_', ' ')}</span></p>}
                            {p.transaction_id && <p><strong>Ref No:</strong> {p.transaction_id}</p>}
                          </div>
                        )}
                        {(p as any).proof_url && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                            <CheckCircle className="w-3 h-3 text-success" />
                            <span>Payment proof uploaded</span>
                            <a href={(p as any).proof_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">View proof</a>
                          </div>
                        )}
                        {p.approved_by_name && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                            <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">Approved by {p.approved_by_name}</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No activity recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activityLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: log.description.includes('approved') || log.description.includes('paid') ? 'var(--success)' : log.description.includes('rejected') ? 'var(--destructive)' : log.description.includes('proof') ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{log.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by <span className="font-medium">{log.user_name}</span> · {new Date(log.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount Paid (₹) *</Label>
                <Input type="number" value={recordedAmount} onChange={e => setRecordedAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference Number / Transaction ID (Optional)</Label>
                <Input placeholder="e.g. UTR number" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
              </div>
              <Button onClick={submitRecordedPayment} className="w-full gradient-primary" disabled={generating || !recordedAmount}>
                {generating ? "Saving..." : "Confirm Payment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Payments;

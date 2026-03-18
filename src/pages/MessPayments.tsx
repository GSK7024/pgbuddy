import { useState, useEffect } from "react";
import { format } from "date-fns";
import { IndianRupee, Check, Clock, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface PaymentRow {
  id: string;
  member_id: string;
  member_name: string;
  plan_name: string;
  month: string;
  base_amount: number;
  off_day_deduction: number;
  final_amount: number;
  status: string;
  payment_date: string | null;
  payment_method: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  partial: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const MessPayments = ({ standalone = true }: { standalone?: boolean }) => {
  const { toast } = useToast();
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const currentMonth = format(new Date(), "yyyy-MM");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Generate month options (last 6 months)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMM yyyy") };
  });

  useEffect(() => {
    if (!effectiveOwnerId || staffLoading) return;
    fetchPayments();
  }, [effectiveOwnerId, staffLoading, selectedMonth]);

  const fetchPayments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("mess_payments" as any)
      .select("*")
      .eq("month", selectedMonth);

    if (!data || data.length === 0) {
      setPayments([]);
      setLoading(false);
      return;
    }

    // Enrich with member names
    const memberIds = [...new Set((data as any[]).map(d => d.member_id))];
    const { data: members } = await supabase
      .from("mess_members" as any)
      .select("id, full_name, plan_id")
      .in("id", memberIds);

    const { data: plans } = await supabase
      .from("mess_plans" as any)
      .select("id, name")
      .eq("owner_id", effectiveOwnerId!);

    const memberMap: Record<string, any> = {};
    (members ?? []).forEach((m: any) => { memberMap[m.id] = m; });
    const planMap: Record<string, string> = {};
    (plans ?? []).forEach((p: any) => { planMap[p.id] = p.name; });

    setPayments((data as any[]).map(p => ({
      ...p,
      member_name: memberMap[p.member_id]?.full_name || "Unknown",
      plan_name: memberMap[p.member_id]?.plan_id ? (planMap[memberMap[p.member_id].plan_id] || "—") : "—",
    })));
    setLoading(false);
  };

  const generateBills = async () => {
    setGenerating(true);
    // Get active members with plans
    const { data: members } = await supabase
      .from("mess_members" as any)
      .select("id, plan_id")
      .eq("owner_id", effectiveOwnerId!)
      .eq("status", "active");

    if (!members || members.length === 0) {
      toast({ title: "No active members to bill", variant: "destructive" });
      setGenerating(false);
      return;
    }

    // Get plan prices
    const { data: plans } = await supabase
      .from("mess_plans" as any)
      .select("id, monthly_price")
      .eq("owner_id", effectiveOwnerId!);

    const priceMap: Record<string, number> = {};
    (plans ?? []).forEach((p: any) => { priceMap[p.id] = p.monthly_price; });

    // Get off day counts for this month
    const monthStart = `${selectedMonth}-01`;
    const nextMonth = new Date(selectedMonth + "-01");
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = format(nextMonth, "yyyy-MM-dd");

    const memberIds = (members as any[]).map(m => m.id);
    const { data: offDays } = await supabase
      .from("mess_off_days" as any)
      .select("member_id, off_date")
      .in("member_id", memberIds)
      .gte("off_date", monthStart)
      .lt("off_date", monthEnd);

    const offCountMap: Record<string, number> = {};
    (offDays ?? []).forEach((o: any) => {
      offCountMap[o.member_id] = (offCountMap[o.member_id] || 0) + 1;
    });

    let created = 0;
    for (const m of (members as any[])) {
      const basePrice = m.plan_id ? (priceMap[m.plan_id] || 0) : 0;
      const daysInMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0).getDate();
      const offCount = offCountMap[m.id] || 0;
      const perDayRate = basePrice / daysInMonth;
      const deduction = Math.round(perDayRate * offCount);
      const finalAmount = basePrice - deduction;

      const { error } = await supabase.from("mess_payments" as any).upsert({
        member_id: m.id,
        month: selectedMonth,
        base_amount: basePrice,
        off_day_deduction: deduction,
        final_amount: finalAmount,
        status: "pending",
      }, { onConflict: "member_id,month" });

      if (!error) created++;
    }

    toast({ title: `Generated ${created} bills!` });
    setGenerating(false);
    fetchPayments();
  };

  const markPaid = async () => {
    if (!markingId) return;
    await supabase.from("mess_payments" as any).update({
      status: "paid",
      payment_date: paymentDate,
      payment_method: paymentMethod,
    }).eq("id", markingId);
    toast({ title: "Payment recorded!" });
    setMarkingId(null);
    fetchPayments();
  };

  const stats = {
    total: payments.reduce((s, p) => s + p.final_amount, 0),
    collected: payments.filter(p => p.status === "paid").reduce((s, p) => s + p.final_amount, 0),
    pending: payments.filter(p => p.status === "pending").reduce((s, p) => s + p.final_amount, 0),
  };

  const content = (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {!standalone ? null : (
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <IndianRupee className="w-6 h-6 text-primary" />
                Mess Payments
              </h1>
              <p className="text-muted-foreground">Monthly billing and payment tracking</p>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generateBills} disabled={generating} className="gradient-primary">
              {generating ? "Generating..." : "Generate Bills"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="py-3 text-center">
            <div className="text-2xl font-bold">₹{stats.total.toLocaleString("en-IN")}</div>
            <div className="text-xs text-muted-foreground">Total Billed</div>
          </CardContent></Card>
          <Card><CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-green-600">₹{stats.collected.toLocaleString("en-IN")}</div>
            <div className="text-xs text-muted-foreground">Collected</div>
          </CardContent></Card>
          <Card><CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">₹{stats.pending.toLocaleString("en-IN")}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent></Card>
        </div>

        {/* Payment List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <IndianRupee className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Bills for This Month</h3>
              <p className="text-muted-foreground text-sm">Click "Generate Bills" to create bills for all active members</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{p.member_name}</span>
                      <Badge className={`text-[10px] ${STATUS_COLORS[p.status] || ""}`}>{p.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{p.plan_name}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Base: ₹{p.base_amount}</span>
                      {p.off_day_deduction > 0 && <span className="text-green-600">- ₹{p.off_day_deduction} off days</span>}
                      <span className="font-semibold text-foreground">= ₹{p.final_amount}</span>
                    </div>
                  </div>
                  <div>
                    {p.status === "pending" ? (
                      <Button size="sm" className="gradient-primary" onClick={() => { setMarkingId(p.id); setPaymentDate(format(new Date(), "yyyy-MM-dd")); }}>
                        <Check className="w-3.5 h-3.5 mr-1" /> Mark Paid
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">{p.payment_date && new Date(p.payment_date).toLocaleDateString("en-IN")} • {p.payment_method}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Mark Paid Dialog */}
        <Dialog open={!!markingId} onOpenChange={(o) => { if (!o) setMarkingId(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Payment Date</Label>
                <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={markPaid} className="w-full gradient-primary">Confirm Payment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content;
};

export default MessPayments;

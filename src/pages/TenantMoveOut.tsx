import { useEffect, useState } from "react";
import { LogOut, Clock, CheckCircle, IndianRupee, AlertTriangle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Assignment {
  id: string;
  property_id: string;
  room_id: string;
  move_in_date: string;
  custom_rent: number | null;
  rooms: { room_number: string; rent_amount: number; deposit_amount: number | null } | null;
  properties: { name: string } | null;
}

interface MoveOutRequest {
  id: string;
  requested_move_out_date: string;
  actual_move_out_date: string | null;
  reason: string | null;
  status: string;
  deposit_amount: number;
  deductions: { label: string; amount: number }[];
  total_deductions: number;
  refund_amount: number;
  refund_status: string;
  refund_date: string | null;
  refund_notes: string | null;
  checklist: Record<string, boolean>;
  created_at: string;
}

const checklistLabels: Record<string, string> = {
  room_inspected: "Room Inspected",
  keys_returned: "Keys Returned",
  dues_cleared: "All Dues Cleared",
  belongings_removed: "Belongings Removed",
  electricity_settled: "Electricity Settled",
};

const TenantMoveOut = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [existingRequest, setExistingRequest] = useState<MoveOutRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [moveOutDate, setMoveOutDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: asg } = await supabase
        .from("tenant_assignments")
        .select("id, property_id, room_id, move_in_date, custom_rent, rooms(room_number, rent_amount, deposit_amount), properties(name)")
        .eq("tenant_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      setAssignment(asg as any);

      if (asg) {
        const { data: req } = await supabase
          .from("move_out_requests")
          .select("*")
          .eq("assignment_id", asg.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (req) {
          setExistingRequest({
            ...req,
            deductions: Array.isArray(req.deductions) ? req.deductions as any : [],
            checklist: (req.checklist ?? {}) as Record<string, boolean>,
          });
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSubmit = async () => {
    if (!assignment || !moveOutDate) return;
    setSubmitting(true);
    const depositAmount = assignment.rooms?.deposit_amount ?? 0;

    const { error } = await supabase.from("move_out_requests").insert({
      tenant_id: user!.id,
      assignment_id: assignment.id,
      property_id: assignment.property_id,
      room_id: assignment.room_id,
      requested_move_out_date: moveOutDate,
      reason: reason || null,
      deposit_amount: depositAmount,
      refund_amount: depositAmount,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Move-out request submitted", description: "Your PG owner will process your checkout." });
      // Refresh
      const { data: req } = await supabase
        .from("move_out_requests")
        .select("*")
        .eq("assignment_id", assignment.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (req) {
        setExistingRequest({
          ...req,
          deductions: Array.isArray(req.deductions) ? req.deductions as any : [],
          checklist: (req.checklist ?? {}) as Record<string, boolean>,
        });
      }
    }
    setSubmitting(false);
  };

  const checklistProgress = existingRequest
    ? (Object.values(existingRequest.checklist).filter(Boolean).length / Object.keys(checklistLabels).length) * 100
    : 0;

  const statusColor = (s: string) => {
    switch (s) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "in_progress": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "completed": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "";
    }
  };

  if (loading) {
    return <TenantLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div></TenantLayout>;
  }

  if (!assignment) {
    return (
      <TenantLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No active room assignment found.</p>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LogOut className="w-6 h-6 text-primary" /> Move-Out
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Request checkout and track your deposit refund</p>
        </div>

        {/* Current Room Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground block">Property</span><span className="font-medium">{assignment.properties?.name}</span></div>
              <div><span className="text-muted-foreground block">Room</span><span className="font-medium">{assignment.rooms?.room_number}</span></div>
              <div><span className="text-muted-foreground block">Move-in Date</span><span className="font-medium">{format(new Date(assignment.move_in_date), "dd MMM yyyy")}</span></div>
              <div><span className="text-muted-foreground block">Deposit Paid</span><span className="font-medium">₹{(assignment.rooms?.deposit_amount ?? 0).toLocaleString()}</span></div>
            </div>
          </CardContent>
        </Card>

        {existingRequest ? (
          /* Existing Request Status */
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Move-Out Request Status</CardTitle>
                  <Badge variant="outline" className={statusColor(existingRequest.status)}>
                    {existingRequest.status.replace("_", " ")}
                  </Badge>
                </div>
                <CardDescription>
                  Requested move-out: {format(new Date(existingRequest.requested_move_out_date), "dd MMM yyyy")}
                  {existingRequest.actual_move_out_date && ` • Actual: ${format(new Date(existingRequest.actual_move_out_date), "dd MMM yyyy")}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Checkout Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Checkout Progress</span>
                    <span className="font-medium">{Math.round(checklistProgress)}%</span>
                  </div>
                  <Progress value={checklistProgress} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {Object.entries(checklistLabels).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {existingRequest.checklist[key] ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className={existingRequest.checklist[key] ? "text-green-600" : "text-muted-foreground"}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Deposit Breakdown */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Deposit Refund Breakdown</h3>
                  <div className="flex justify-between p-2 rounded bg-muted/50 text-sm">
                    <span>Security Deposit</span>
                    <span className="font-medium">₹{existingRequest.deposit_amount.toLocaleString()}</span>
                  </div>
                  {existingRequest.deductions.map((d, i) => (
                    <div key={i} className="flex justify-between p-2 rounded border border-destructive/20 bg-destructive/5 text-sm">
                      <span>{d.label}</span>
                      <span className="text-destructive font-medium">-₹{d.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 rounded-lg bg-green-500/10 font-semibold">
                    <span>Refund Amount</span>
                    <span className="text-green-600">₹{existingRequest.refund_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Refund Status:</span>
                    <Badge variant="outline" className={
                      existingRequest.refund_status === "paid" ? "bg-green-500/10 text-green-600" :
                      existingRequest.refund_status === "approved" ? "bg-blue-500/10 text-blue-600" :
                      "bg-yellow-500/10 text-yellow-600"
                    }>
                      {existingRequest.refund_status}
                    </Badge>
                    {existingRequest.refund_date && <span className="text-muted-foreground">on {format(new Date(existingRequest.refund_date), "dd MMM yyyy")}</span>}
                  </div>
                  {existingRequest.refund_notes && (
                    <p className="text-sm text-muted-foreground italic">Note: {existingRequest.refund_notes}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* New Move-Out Request Form */
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submit Move-Out Request</CardTitle>
              <CardDescription>Fill in the details below to request your checkout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Preferred Move-Out Date *</Label>
                <Input type="date" value={moveOutDate} onChange={e => setMoveOutDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Reason for leaving (optional)</Label>
                <Textarea placeholder="e.g., Relocating for work, course completed..." value={reason} onChange={e => setReason(e.target.value)} maxLength={500} />
              </div>
              <Button onClick={handleSubmit} disabled={!moveOutDate || submitting} className="w-full">
                <Send className="w-4 h-4 mr-2" /> Submit Move-Out Request
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TenantLayout>
  );
};

export default TenantMoveOut;

import { useEffect, useState, useCallback } from "react";
import { LogOut, CheckCircle, Clock, IndianRupee, ClipboardCheck, AlertTriangle, Eye, Plus, Minus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MoveOutRequest {
  id: string;
  tenant_id: string;
  assignment_id: string;
  property_id: string;
  room_id: string;
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
  rooms?: { room_number: string };
  properties?: { name: string };
  profiles?: { full_name: string; phone: string | null };
}

const checklistLabels: Record<string, string> = {
  room_inspected: "Room Inspected",
  keys_returned: "Keys Returned",
  dues_cleared: "All Dues Cleared",
  belongings_removed: "Belongings Removed",
  electricity_settled: "Electricity Settled",
};

const MoveOutManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<MoveOutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MoveOutRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields in dialog
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [deductions, setDeductions] = useState<{ label: string; amount: number }[]>([]);
  const [newDeductionLabel, setNewDeductionLabel] = useState("");
  const [newDeductionAmount, setNewDeductionAmount] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [actualMoveOutDate, setActualMoveOutDate] = useState("");

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("move_out_requests")
      .select("*, rooms(room_number), properties(name)")
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch tenant profiles
      const tenantIds = [...new Set(data.map((r: any) => r.tenant_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", tenantIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));
      const enriched = data.map((r: any) => ({
        ...r,
        deductions: Array.isArray(r.deductions) ? r.deductions : [],
        checklist: r.checklist ?? {},
        profiles: profileMap.get(r.tenant_id) ?? { full_name: "Unknown", phone: null },
      }));
      setRequests(enriched);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openDetail = (req: MoveOutRequest) => {
    setSelectedRequest(req);
    setChecklist({ ...req.checklist });
    setDeductions([...(req.deductions || [])]);
    setRefundNotes(req.refund_notes ?? "");
    setActualMoveOutDate(req.actual_move_out_date ?? req.requested_move_out_date);
    setDialogOpen(true);
  };

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const calculatedRefund = Math.max(0, (selectedRequest?.deposit_amount ?? 0) - totalDeductions);

  const addDeduction = () => {
    if (!newDeductionLabel.trim() || !newDeductionAmount) return;
    setDeductions([...deductions, { label: newDeductionLabel.trim(), amount: parseFloat(newDeductionAmount) }]);
    setNewDeductionLabel("");
    setNewDeductionAmount("");
  };

  const removeDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setSaving(true);
    const allChecked = Object.values(checklist).every(Boolean);
    const newStatus = allChecked ? "completed" : "in_progress";

    const { error } = await supabase
      .from("move_out_requests")
      .update({
        status: newStatus,
        checklist,
        deductions,
        total_deductions: totalDeductions,
        refund_amount: calculatedRefund,
        refund_notes: refundNotes,
        actual_move_out_date: actualMoveOutDate,
        refund_status: allChecked ? "approved" : "pending",
        processed_by: user?.id,
      })
      .eq("id", selectedRequest.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // If completed, deactivate tenant assignment and mark room vacant
      if (allChecked) {
        await supabase
          .from("tenant_assignments")
          .update({ is_active: false, move_out_date: actualMoveOutDate })
          .eq("id", selectedRequest.assignment_id);
      }
      toast({ title: newStatus === "completed" ? "Move-out completed!" : "Progress saved", description: allChecked ? "Tenant has been checked out and deposit refund approved." : "Checklist updated. Complete all items to finalize." });
      setDialogOpen(false);
      fetchRequests();
    }
    setSaving(false);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setSaving(true);
    await supabase
      .from("move_out_requests")
      .update({ status: "rejected", processed_by: user?.id })
      .eq("id", selectedRequest.id);
    toast({ title: "Request rejected" });
    setDialogOpen(false);
    fetchRequests();
    setSaving(false);
  };

  const markRefundPaid = async (id: string) => {
    await supabase
      .from("move_out_requests")
      .update({ refund_status: "paid", refund_date: new Date().toISOString().split("T")[0] })
      .eq("id", id);
    toast({ title: "Refund marked as paid" });
    fetchRequests();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "in_progress": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "completed": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "";
    }
  };

  const pending = requests.filter(r => r.status === "pending");
  const inProgress = requests.filter(r => r.status === "in_progress");
  const completed = requests.filter(r => r.status === "completed" || r.status === "rejected");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LogOut className="w-6 h-6 text-primary" /> Move-Out Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Process tenant checkouts with deposit refund tracking</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{inProgress.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{completed.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <IndianRupee className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">₹{requests.filter(r => r.refund_status === "approved").reduce((s, r) => s + r.refund_amount, 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pending Refunds</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({inProgress.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          {["pending", "in_progress", "completed"].map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {(tab === "pending" ? pending : tab === "in_progress" ? inProgress : completed).length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground">No {tab.replace("_", " ")} requests</CardContent></Card>
              ) : (
                (tab === "pending" ? pending : tab === "in_progress" ? inProgress : completed).map(req => (
                  <Card key={req.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{req.profiles?.full_name}</p>
                            <Badge variant="outline" className={statusColor(req.status)}>{req.status.replace("_", " ")}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {req.properties?.name} • Room {req.rooms?.room_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Requested: {format(new Date(req.requested_move_out_date), "dd MMM yyyy")}
                            {req.reason && ` • Reason: ${req.reason}`}
                          </p>
                          <div className="flex gap-3 text-xs">
                            <span>Deposit: ₹{req.deposit_amount.toLocaleString()}</span>
                            {req.total_deductions > 0 && <span className="text-destructive">Deductions: ₹{req.total_deductions.toLocaleString()}</span>}
                            {req.refund_amount > 0 && <span className="text-green-600">Refund: ₹{req.refund_amount.toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openDetail(req)}>
                            <Eye className="w-4 h-4 mr-1" /> Process
                          </Button>
                          {req.status === "completed" && req.refund_status === "approved" && (
                            <Button size="sm" onClick={() => markRefundPaid(req.id)}>
                              <IndianRupee className="w-4 h-4 mr-1" /> Mark Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Process Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Process Move-Out: {selectedRequest?.profiles?.full_name}</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6">
                {/* Tenant Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Property:</span> {selectedRequest.properties?.name}</div>
                  <div><span className="text-muted-foreground">Room:</span> {selectedRequest.rooms?.room_number}</div>
                  <div><span className="text-muted-foreground">Requested Date:</span> {format(new Date(selectedRequest.requested_move_out_date), "dd MMM yyyy")}</div>
                  <div><span className="text-muted-foreground">Reason:</span> {selectedRequest.reason || "N/A"}</div>
                </div>

                <Separator />

                {/* Actual Move-Out Date */}
                <div className="space-y-2">
                  <Label>Actual Move-Out Date</Label>
                  <Input type="date" value={actualMoveOutDate} onChange={e => setActualMoveOutDate(e.target.value)} />
                </div>

                {/* Checkout Checklist */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> Checkout Checklist</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(checklistLabels).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2 p-2 rounded-lg border">
                        <Checkbox
                          checked={checklist[key] ?? false}
                          onCheckedChange={(checked) => setChecklist({ ...checklist, [key]: !!checked })}
                          disabled={selectedRequest.status === "completed" || selectedRequest.status === "rejected"}
                        />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Deposit & Deductions */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Deposit Refund</h3>
                  <div className="p-3 rounded-lg bg-muted/50 flex justify-between">
                    <span>Security Deposit</span>
                    <span className="font-semibold">₹{selectedRequest.deposit_amount.toLocaleString()}</span>
                  </div>

                  {/* Deductions List */}
                  {deductions.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded border border-destructive/20 bg-destructive/5">
                      <span className="text-sm">{d.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-destructive font-medium">-₹{d.amount.toLocaleString()}</span>
                        {selectedRequest.status !== "completed" && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeDeduction(i)}>
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Deduction */}
                  {selectedRequest.status !== "completed" && selectedRequest.status !== "rejected" && (
                    <div className="flex gap-2">
                      <Input placeholder="Deduction reason" value={newDeductionLabel} onChange={e => setNewDeductionLabel(e.target.value)} className="flex-1" />
                      <Input type="number" placeholder="Amount" value={newDeductionAmount} onChange={e => setNewDeductionAmount(e.target.value)} className="w-28" />
                      <Button size="sm" variant="outline" onClick={addDeduction}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <Separator />
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10">
                    <span className="font-semibold">Refund Amount</span>
                    <span className="text-lg font-bold text-green-600">₹{calculatedRefund.toLocaleString()}</span>
                  </div>
                </div>

                {/* Refund Notes */}
                <div className="space-y-2">
                  <Label>Refund Notes</Label>
                  <Textarea
                    placeholder="Notes about the refund..."
                    value={refundNotes}
                    onChange={e => setRefundNotes(e.target.value)}
                    disabled={selectedRequest.status === "completed" || selectedRequest.status === "rejected"}
                  />
                </div>

                {/* Actions */}
                {selectedRequest.status !== "completed" && selectedRequest.status !== "rejected" && (
                  <div className="flex gap-3 justify-end">
                    <Button variant="destructive" onClick={handleReject} disabled={saving}>Reject</Button>
                    <Button onClick={handleApprove} disabled={saving}>
                      {Object.values(checklist).every(Boolean) ? "Complete & Approve Refund" : "Save Progress"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MoveOutManagement;

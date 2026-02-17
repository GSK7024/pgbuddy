import { useEffect, useState } from "react";
import { BellDot, Plus, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Notice {
  id: string;
  notice_date: string;
  expected_move_out: string;
  status: string;
  reason: string | null;
  rooms: { room_number: string } | null;
  properties: { name: string } | null;
}

const TenantNotices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignment, setAssignment] = useState<{ property_id: string; room_id: string } | null>(null);
  const [hasActiveNotice, setHasActiveNotice] = useState(false);

  // Form
  const [reason, setReason] = useState("");
  const [moveOutDate, setMoveOutDate] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [noticeRes, assignRes] = await Promise.all([
      supabase
        .from("vacancy_notices")
        .select("*, rooms(room_number), properties(name)")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tenant_assignments")
        .select("property_id, room_id")
        .eq("tenant_id", user.id)
        .eq("is_active", true)
        .maybeSingle(),
    ]);
    const data = noticeRes.data ?? [];
    setNotices(data);
    setAssignment(assignRes.data);
    setHasActiveNotice(data.some(n => n.status === "submitted"));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Default move-out date: 1 month from today
  useEffect(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setMoveOutDate(d.toISOString().split("T")[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !assignment) return;

    // Validate min 1 month notice
    const moveOut = new Date(moveOutDate);
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() + 1);
    minDate.setDate(minDate.getDate() - 1); // allow same day next month

    if (moveOut < minDate) {
      toast({ title: "Minimum 1-month notice required", description: "Please select a move-out date at least 1 month from today.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("vacancy_notices").insert({
      tenant_id: user.id,
      property_id: assignment.property_id,
      room_id: assignment.room_id,
      expected_move_out: moveOutDate,
      reason: reason || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vacancy notice submitted!", description: "Your PG owner has been notified." });
      setDialogOpen(false);
      setReason("");
      fetchData();
    }
  };

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Vacancy Notices</h1>
            <p className="text-muted-foreground">Submit your move-out notice (1-month advance)</p>
          </div>
          {assignment && !hasActiveNotice && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary gap-2">
                  <Plus className="w-4 h-4" /> Submit Notice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Vacancy Notice</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-3 rounded-lg bg-warning/10 text-sm text-warning border border-warning/20">
                    ⚠️ A minimum 1-month advance notice is required before moving out.
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Move-out Date *</Label>
                    <Input type="date" value={moveOutDate} onChange={e => setMoveOutDate(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason for leaving</Label>
                    <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional - why are you moving out?" rows={3} />
                  </div>
                  <Button type="submit" className="w-full gradient-primary">Submit Notice</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : notices.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BellDot className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vacancy notices</h3>
              <p className="text-muted-foreground">Submit a notice when you plan to move out</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notices.map(n => (
              <Card key={n.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{n.properties?.name} · Room {n.rooms?.room_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {n.notice_date} → Move-out: {n.expected_move_out}
                      </p>
                      {n.reason && <p className="text-sm mt-1">{n.reason}</p>}
                    </div>
                  </div>
                  <Badge
                    variant={n.status === "acknowledged" ? "default" : "secondary"}
                    className={n.status === "acknowledged" ? "bg-success" : ""}
                  >
                    {n.status === "acknowledged" ? (
                      <><CheckCircle className="w-3 h-3 mr-1" />Acknowledged</>
                    ) : n.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
};

export default TenantNotices;

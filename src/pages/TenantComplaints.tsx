import { useEffect, useState } from "react";
import { MessageSquare, Plus, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWhatsAppNotify } from "@/hooks/useWhatsAppNotify";

interface Complaint {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  properties: { name: string } | null;
}

const categories = ["plumbing", "electrical", "cleaning", "food", "noise", "security", "general"];

const TenantComplaints = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { send: sendWhatsApp } = useWhatsAppNotify();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignment, setAssignment] = useState<{ property_id: string; room_number?: string; bed_label?: string; sharing_type?: string } | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [compRes, assignRes] = await Promise.all([
      supabase
        .from("complaints")
        .select("*, properties(name)")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tenant_assignments")
        .select("property_id, room_id, bed_id, rooms(room_number)")
        .eq("tenant_id", user.id)
        .eq("is_active", true)
        .maybeSingle(),
    ]);
    setComplaints(compRes.data ?? []);

    // Enrich assignment with bed info
    if (assignRes.data) {
      const a = assignRes.data as any;
      let bedLabel: string | undefined;
      let sharingType: string | undefined;
      if (a.bed_id) {
        const { data: bed } = await (supabase as any).from("beds").select("bed_label, sharing_type").eq("id", a.bed_id).maybeSingle();
        if (bed) { bedLabel = (bed as any).bed_label; sharingType = (bed as any).sharing_type; }
      }
      setAssignment({
        property_id: a.property_id,
        room_number: a.rooms?.room_number,
        bed_label: bedLabel,
        sharing_type: sharingType,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !assignment || submitting) return;
    setSubmitting(true);

    const { error } = await supabase.from("complaints").insert({
      tenant_id: user.id,
      property_id: assignment.property_id,
      title,
      description: description || null,
      category,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Complaint filed!" });
      setDialogOpen(false);
      setTitle(""); setDescription(""); setCategory("general");
      fetchData();

      // WhatsApp alert to owner + manager (non-blocking)
      sendWhatsApp("send-complaint-alert", {
        property_id: assignment.property_id,
        title,
        category,
        tenant_name: user.user_metadata?.full_name || user.email,
        tenant_phone: user.phone,
        room_number: assignment.room_number,
      });
    }
    setSubmitting(false);
  };

  const statusColor = (s: string) => {
    if (s === "resolved") return "bg-success";
    if (s === "in_progress") return "bg-warning";
    return "bg-destructive";
  };

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Complaints</h1>
            <p className="text-muted-foreground">File and track maintenance requests</p>
          </div>
          {assignment ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary gap-2">
                  <Plus className="w-4 h-4" /> File Complaint
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>File a Complaint</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief issue title" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue in detail..." rows={4} />
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={submitting}>{submitting ? "Submitting..." : "Submit Complaint"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
             <Button 
               variant="outline" 
               className="gap-2 cursor-not-allowed opacity-50"
               title="You must be assigned to a room to file a complaint"
               onClick={() => toast({ title: "Not Assigned", description: "You need an active room assignment to file complaints.", variant: "destructive" })}
             >
               <Plus className="w-4 h-4" /> File Complaint
             </Button>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : complaints.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No complaints filed</h3>
              <p className="text-muted-foreground">File a complaint if you face any issues</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.map(c => (
              <Card key={c.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {c.category}
                        {assignment?.room_number && <> · Room {assignment.room_number}</>}
                        {assignment?.sharing_type && <> · {assignment.sharing_type}</>}
                        {assignment?.bed_label && <> · Bed {assignment.bed_label}</>}
                        {" · "}{new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={statusColor(c.status)}>{c.status}</Badge>
                  </div>
                  {c.description && <p className="text-sm">{c.description}</p>}
                  {c.resolution_notes && (
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <p className="font-medium text-xs text-muted-foreground mb-1">
                        <CheckCircle className="w-3 h-3 inline mr-1" />Resolution:
                      </p>
                      {c.resolution_notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
};

export default TenantComplaints;

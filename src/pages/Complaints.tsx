import { useEffect, useState } from "react";
import { MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Complaint {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  properties?: { name: string };
}

const Complaints = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const fetchComplaints = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("complaints")
      .select("*, properties(name)")
      .order("created_at", { ascending: false });
    setComplaints(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchComplaints(); }, [user]);

  const resolveComplaint = async (id: string) => {
    await supabase.from("complaints").update({
      status: "resolved",
      resolution_notes: resolutionNotes,
    }).eq("id", id);
    toast({ title: "Complaint resolved" });
    setResolvingId(null);
    setResolutionNotes("");
    fetchComplaints();
  };

  const statusColor = (s: string) => {
    if (s === "resolved") return "bg-success";
    if (s === "in_progress") return "bg-warning";
    return "bg-destructive";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Complaints</h1>
          <p className="text-muted-foreground">View and resolve tenant complaints</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : complaints.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No complaints</h3>
              <p className="text-muted-foreground">All clear! No complaints from tenants</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.map(c => (
              <Card key={c.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="text-sm text-muted-foreground">{(c as any).properties?.name} · {c.category}</p>
                    </div>
                    <Badge className={statusColor(c.status)}>{c.status}</Badge>
                  </div>
                  {c.description && <p className="text-sm">{c.description}</p>}
                  {c.resolution_notes && (
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <p className="font-medium text-xs text-muted-foreground mb-1">Resolution:</p>
                      {c.resolution_notes}
                    </div>
                  )}
                  {c.status !== "resolved" && (
                    resolvingId === c.id ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Resolution notes..."
                          value={resolutionNotes}
                          onChange={e => setResolutionNotes(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="gradient-primary" onClick={() => resolveComplaint(c.id)}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setResolvingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setResolvingId(c.id)}>
                        Resolve Complaint
                      </Button>
                    )
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

export default Complaints;

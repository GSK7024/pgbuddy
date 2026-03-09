import { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, AlertTriangle, Info, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import OverLimitBanner from "@/components/OverLimitBanner";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_active: boolean;
  created_at: string;
  properties?: { name: string };
}

const Announcements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isReadOnly, isOverLimit, tenantCount, limits } = useSubscriptionGuard();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form
  const [propertyId, setPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");

  const fetchData = async () => {
    if (!user) return;
    const [annRes, propRes] = await Promise.all([
      supabase.from("announcements").select("*, properties(name)").order("created_at", { ascending: false }),
      supabase.from("properties").select("id, name").eq("owner_id", user.id),
    ]);
    setAnnouncements(annRes.data ?? []);
    setProperties(propRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;

    const { error } = await supabase.from("announcements").insert({
      property_id: propertyId,
      title,
      content,
      priority,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Announcement posted!" });
      setDialogOpen(false);
      setTitle(""); setContent(""); setPriority("normal");
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    toast({ title: "Announcement deleted" });
    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("announcements").update({ is_active: !current }).eq("id", id);
    fetchData();
  };

  const priorityIcon = (p: string) => {
    if (p === "urgent") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (p === "important") return <Bell className="w-4 h-4 text-warning" />;
    return <Info className="w-4 h-4 text-primary" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isOverLimit && (
          <OverLimitBanner tenantCount={tenantCount} tenantLimit={limits.tenantLimit} planName={limits.name} />
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-muted-foreground">Post rules, updates, and notices for your tenants</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2" disabled={isReadOnly}><Plus className="w-4 h-4" /> New Announcement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Property *</Label>
                  <Select value={propertyId} onValueChange={setPropertyId}>
                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>
                      {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Water supply schedule change" required />
                </div>
                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your announcement..." rows={4} required />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full gradient-primary">Post Announcement</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : announcements.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No announcements</h3>
              <p className="text-muted-foreground">Post rules, updates, or notices for your tenants</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <Card key={a.id} className={!a.is_active ? "opacity-60" : ""}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {priorityIcon(a.priority)}
                      <div>
                        <h3 className="font-semibold">{a.title}</h3>
                        <p className="text-xs text-muted-foreground">{(a as any).properties?.name} · {new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={a.is_active ? "default" : "secondary"}
                        className={`cursor-pointer text-xs ${a.is_active ? "bg-success" : ""}`}
                        onClick={() => toggleActive(a.id, a.is_active)}
                      >
                        {a.is_active ? "Active" : "Hidden"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm pl-7">{a.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Announcements;

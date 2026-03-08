import { useEffect, useState } from "react";
import { UserCheck, Plus, LogIn, LogOut, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

interface Visitor {
  id: string;
  visitor_name: string;
  visitor_phone: string | null;
  purpose: string;
  check_in: string;
  check_out: string | null;
  notes: string | null;
  properties?: { name: string };
}

const purposes = ["visit", "delivery", "maintenance", "interview", "other"];

const VisitorLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("visit");
  const [propId, setPropId] = useState("");
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [visRes, propRes] = await Promise.all([
      supabase.from("visitor_logs").select("*, properties(name)").order("check_in", { ascending: false }).limit(50),
      supabase.from("properties").select("id, name").eq("owner_id", user.id),
    ]);
    setVisitors(visRes.data ?? []);
    const props = propRes.data ?? [];
    setProperties(props);
    if (props.length === 1 && !propId) setPropId(props[0].id);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !propId) return;

    const { error } = await supabase.from("visitor_logs").insert({
      property_id: propId,
      visitor_name: name,
      visitor_phone: phone || null,
      purpose,
      notes: notes || null,
      created_by: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Visitor checked in!" });
      setDialogOpen(false);
      setName(""); setPhone(""); setNotes("");
      fetchData();
    }
  };

  const checkOut = async (id: string) => {
    await supabase.from("visitor_logs").update({ check_out: new Date().toISOString() }).eq("id", id);
    toast({ title: "Visitor checked out" });
    fetchData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Visitor Log</h1>
            <p className="text-muted-foreground">Track visitors entering your PG</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <Plus className="w-4 h-4" /> Check In Visitor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Visitor Check-in</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {properties.length > 1 && (
                  <div className="space-y-2">
                    <Label>Property</Label>
                    <Select value={propId} onValueChange={setPropId}>
                      <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                      <SelectContent>
                        {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Visitor Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
                </div>
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {purposes.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
                </div>
                <Button type="submit" className="w-full gradient-primary">Check In</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : visitors.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <UserCheck className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No visitor entries</h3>
              <p className="text-muted-foreground">Start logging visitors when they arrive</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visitors.map(v => (
              <Card key={v.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${v.check_out ? "bg-muted" : "bg-success/20"}`}>
                      {v.check_out ? <LogOut className="w-4 h-4 text-muted-foreground" /> : <LogIn className="w-4 h-4 text-success" />}
                    </div>
                    <div>
                      <p className="font-medium">{v.visitor_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {v.purpose} · {(v as any).properties?.name} · {new Date(v.check_in).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {v.visitor_phone && <p className="text-xs text-muted-foreground">{v.visitor_phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.check_out ? (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Out {new Date(v.check_out).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => checkOut(v.id)}>
                        <LogOut className="w-3 h-3 mr-1" /> Check Out
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VisitorLog;

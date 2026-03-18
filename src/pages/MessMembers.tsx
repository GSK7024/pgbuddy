import { useState, useEffect } from "react";
import { Plus, Search, Phone, Edit2, UserX, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface MessMember {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  plan_id: string | null;
  plan_name?: string;
  start_date: string;
  end_date: string | null;
  status: string;
  notes: string | null;
}

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const MessMembers = () => {
  const { toast } = useToast();
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const [members, setMembers] = useState<MessMember[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MessMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!effectiveOwnerId || staffLoading) return;
    fetchData();
  }, [effectiveOwnerId, staffLoading]);

  const fetchData = async () => {
    const [membersRes, plansRes] = await Promise.all([
      supabase.from("mess_members" as any).select("*").eq("owner_id", effectiveOwnerId!).order("created_at", { ascending: false }),
      supabase.from("mess_plans" as any).select("id, name, monthly_price").eq("owner_id", effectiveOwnerId!).eq("is_active", true),
    ]);

    const plansData = (plansRes.data ?? []) as Plan[];
    setPlans(plansData);

    const planMap: Record<string, string> = {};
    plansData.forEach(p => { planMap[p.id] = p.name; });

    setMembers((membersRes.data ?? []).map((m: any) => ({
      ...m,
      plan_name: m.plan_id ? planMap[m.plan_id] || "Unknown" : "No Plan",
    })));
    setLoading(false);
  };

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setPlanId("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setEditing(null);
  };

  const openEdit = (member: MessMember) => {
    setEditing(member);
    setFullName(member.full_name);
    setPhone(member.phone || "");
    setEmail(member.email || "");
    setPlanId(member.plan_id || "");
    setStartDate(member.start_date);
    setNotes(member.notes || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!fullName) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      owner_id: effectiveOwnerId!,
      full_name: fullName,
      phone: phone || null,
      email: email || null,
      plan_id: planId || null,
      start_date: startDate,
      notes: notes || null,
    };

    if (editing) {
      await supabase.from("mess_members" as any).update(payload).eq("id", editing.id);
      toast({ title: "Member updated!" });
    } else {
      await supabase.from("mess_members" as any).insert(payload);
      toast({ title: "Member added!" });
    }
    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const toggleStatus = async (member: MessMember) => {
    const newStatus = member.status === "active" ? "paused" : "active";
    await supabase.from("mess_members" as any).update({ status: newStatus }).eq("id", member.id);
    toast({ title: `Member ${newStatus}` });
    fetchData();
  };

  const cancelMember = async (id: string) => {
    if (!confirm("Cancel this member's subscription?")) return;
    await supabase.from("mess_members" as any).update({ status: "cancelled", end_date: new Date().toISOString().split("T")[0] }).eq("id", id);
    toast({ title: "Member cancelled" });
    fetchData();
  };

  const filtered = members.filter(m => {
    const matchesSearch = m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.phone && m.phone.includes(searchQuery));
    const matchesStatus = filterStatus === "all" || m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === "active").length,
    paused: members.filter(m => m.status === "paused").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Mess Members
            </h1>
            <p className="text-muted-foreground">Manage your meal subscribers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2"><Plus className="w-4 h-4" /> Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Member" : "Add New Member"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input placeholder="Member name" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone</Label>
                    <Input placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Meal Plan</Label>
                    <Select value={planId} onValueChange={setPlanId}>
                      <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                      <SelectContent>
                        {plans.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} — ₹{p.monthly_price}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Any special requirements..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
                  {saving ? "Saving..." : editing ? "Update Member" : "Add Member"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="py-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent></Card>
          <Card><CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent></Card>
          <Card><CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.paused}</div>
            <div className="text-xs text-muted-foreground">Paused</div>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or phone..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Members List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading members...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Members</h3>
              <p className="text-muted-foreground text-sm">Add your first mess member to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(member => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{member.full_name}</span>
                      <Badge className={`text-[10px] ${STATUS_COLORS[member.status] || ""}`}>
                        {member.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{member.plan_name}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {member.phone && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.phone}</span>
                      )}
                      <span>Since {new Date(member.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(member)} title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(member)} title={member.status === "active" ? "Pause" : "Activate"}>
                      {member.status === "active" ? <UserX className="w-3.5 h-3.5 text-yellow-600" /> : <UserCheck className="w-3.5 h-3.5 text-green-600" />}
                    </Button>
                    {member.status !== "cancelled" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => cancelMember(member.id)} title="Cancel">
                        <UserX className="w-3.5 h-3.5" />
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

export default MessMembers;

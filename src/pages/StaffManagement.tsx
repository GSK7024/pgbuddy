import { useEffect, useState } from "react";
import { Users, Plus, Shield, Calculator, Wrench, Trash2, Building2, Globe, Mail, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  staff_user_id: string | null;
  invited_email: string | null;
  role: string;
  property_id: string | null;
  status: string;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
}

const roleConfig = {
  manager: { label: "Manager", icon: Shield, color: "bg-primary/10 text-primary", desc: "Full access (properties, tenants, payments, complaints, visitors)" },
  accountant: { label: "Accountant", icon: Calculator, color: "bg-warning/10 text-warning", desc: "Payments, expenses, utility bills" },
  caretaker: { label: "Caretaker", icon: Wrench, color: "bg-success/10 text-success", desc: "Complaints, visitors, announcements" },
};

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
  active: { icon: CheckCircle, color: "text-success" },
  pending: { icon: Clock, color: "text-warning" },
  revoked: { icon: XCircle, color: "text-destructive" },
};

const StaffManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("caretaker");
  const [invitePropertyId, setInvitePropertyId] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [staffRes, propRes] = await Promise.all([
      supabase
        .from("staff_members")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("properties")
        .select("id, name")
        .eq("owner_id", user.id),
    ]);
    setStaff((staffRes.data as unknown as StaffMember[]) ?? []);
    setProperties(propRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleInvite = async () => {
    if (!user || !inviteEmail.trim()) return;
    setSubmitting(true);

    // Look up user by email
    const { data: found } = await supabase.rpc("find_user_by_email", { _email: inviteEmail.trim() });
    const staffUserId = found?.[0]?.user_id || null;

    const { error } = await supabase.from("staff_members").insert({
      owner_id: user.id,
      staff_user_id: staffUserId,
      invited_email: inviteEmail.trim(),
      role: inviteRole as any,
      property_id: invitePropertyId === "all" ? null : invitePropertyId,
      status: staffUserId ? "active" : "pending",
    });

    if (error) {
      toast({ title: "Failed to add staff", description: error.message, variant: "destructive" });
    } else {
      toast({ title: staffUserId ? "Staff member added!" : "Invitation sent!", description: staffUserId ? "They now have access based on their role." : "They'll get access once they sign up with this email." });
      setShowInvite(false);
      setInviteEmail("");
      setInviteRole("caretaker");
      setInvitePropertyId("all");
      fetchData();
    }
    setSubmitting(false);
  };

  const handleRemove = async (id: string) => {
    await supabase.from("staff_members").delete().eq("id", id);
    toast({ title: "Staff member removed" });
    fetchData();
  };

  const handleUpdateRole = async (id: string, role: string) => {
    await supabase.from("staff_members").update({ role: role as any }).eq("id", id);
    toast({ title: "Role updated" });
    fetchData();
  };

  const getPropertyName = (propId: string | null) => {
    if (!propId) return "All Properties";
    return properties.find(p => p.id === propId)?.name || "Unknown";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Staff Management
            </h1>
            <p className="text-muted-foreground">Invite and manage staff members for your properties</p>
          </div>
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Staff Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="staff@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">If this person has an account, they'll get immediate access. Otherwise, they'll get access when they sign up.</p>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <config.icon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {roleConfig[inviteRole as keyof typeof roleConfig]?.desc}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Property Access</Label>
                  <Select value={invitePropertyId} onValueChange={setInvitePropertyId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="flex items-center gap-2">
                          <Globe className="w-3 h-3" /> All Properties
                        </span>
                      </SelectItem>
                      {properties.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            <Building2 className="w-3 h-3" /> {p.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
                <Button onClick={handleInvite} disabled={!inviteEmail.trim() || submitting}>
                  {submitting ? "Inviting..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Role legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(roleConfig).map(([key, config]) => (
            <Card key={key} className="border-dashed">
              <CardContent className="py-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                  <config.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Staff list */}
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : staff.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No staff members</h3>
              <p className="text-muted-foreground mb-4">Add staff to help manage your properties</p>
              <Button onClick={() => setShowInvite(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Add Your First Staff
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {staff.map((s) => {
              const config = roleConfig[s.role as keyof typeof roleConfig] || roleConfig.caretaker;
              const statusConf = statusConfig[s.status] || statusConfig.pending;
              const StatusIcon = statusConf.icon;
              return (
                <Card key={s.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                          <config.icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              <Mail className="w-3 h-3 inline mr-1" />
                              {s.invited_email || "Unknown"}
                            </p>
                            <StatusIcon className={`w-4 h-4 shrink-0 ${statusConf.color}`} />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              {s.property_id ? <Building2 className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                              {getPropertyName(s.property_id)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select value={s.role} onValueChange={(val) => handleUpdateRole(s.id, val)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(roleConfig).map(([key, c]) => (
                              <SelectItem key={key} value={key}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemove(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffManagement;

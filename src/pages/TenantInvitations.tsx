import { useEffect, useState } from "react";
import { Link, Plus, Copy, UserCheck, Clock, XCircle, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface Invitation {
  id: string;
  invite_code: string;
  tenant_name: string | null;
  tenant_email: string | null;
  tenant_phone: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  rooms?: { room_number: string };
  properties?: { name: string };
}

const TenantInvitations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; room_number: string; property_id: string; is_vacant: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");

  const fetchData = async () => {
    if (!effectiveOwnerId) return;
    const [invRes, propRes, roomRes] = await Promise.all([
      supabase.from("tenant_invitations").select("*, rooms(room_number), properties(name)").order("created_at", { ascending: false }),
      supabase.from("properties").select("id, name").eq("owner_id", effectiveOwnerId),
      supabase.from("rooms").select("id, room_number, property_id, is_vacant"),
    ]);
    setInvitations(invRes.data ?? []);
    setProperties(propRes.data ?? []);
    setRooms(roomRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { if (!staffLoading) fetchData(); }, [effectiveOwnerId, staffLoading]);

  const vacantRoomsForProperty = rooms.filter(r => r.property_id === propertyId && r.is_vacant);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !roomId) return;

    const { error } = await supabase.from("tenant_invitations").insert({
      property_id: propertyId,
      room_id: roomId,
      tenant_name: tenantName || null,
      tenant_email: tenantEmail || null,
      tenant_phone: tenantPhone || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invitation created!" });
      setDialogOpen(false);
      setTenantName(""); setTenantEmail(""); setTenantPhone("");
      setPropertyId(""); setRoomId("");
      fetchData();
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/auth?mode=signup&role=tenant&invite=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share this with the tenant to sign up." });
  };

  const cancelInvite = async (id: string) => {
    await supabase.from("tenant_invitations").update({ status: "cancelled" }).eq("id", id);
    toast({ title: "Invitation cancelled" });
    fetchData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tenant Invitations</h1>
            <p className="text-muted-foreground">Create invite links for new tenants to sign up</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2"><Plus className="w-4 h-4" /> Create Invite</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite a Tenant</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Property *</Label>
                  <Select value={propertyId} onValueChange={v => { setPropertyId(v); setRoomId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>
                      {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room * {propertyId && `(${vacantRoomsForProperty.length} vacant)`}</Label>
                  <Select value={roomId} onValueChange={setRoomId} disabled={!propertyId}>
                    <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>
                      {vacantRoomsForProperty.map(r => <SelectItem key={r.id} value={r.id}>Room {r.room_number}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tenant Name (optional)</Label>
                  <Input value={tenantName} onChange={e => setTenantName(e.target.value)} placeholder="e.g. Rahul Sharma" />
                </div>
                <div className="space-y-2">
                  <Label>Tenant Email (optional)</Label>
                  <Input type="email" value={tenantEmail} onChange={e => setTenantEmail(e.target.value)} placeholder="tenant@email.com" />
                </div>
                <div className="space-y-2">
                  <Label>Tenant Phone (optional)</Label>
                  <Input value={tenantPhone} onChange={e => setTenantPhone(e.target.value)} placeholder="+91..." />
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={!propertyId || !roomId}>Create Invitation</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : invitations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Share2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invitations yet</h3>
              <p className="text-muted-foreground">Create invite links and share them with tenants</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invitations.map(inv => {
              const isExpired = new Date(inv.expires_at) < new Date();
              const isPending = inv.status === "pending" && !isExpired;

              return (
                <Card key={inv.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {inv.tenant_name || inv.tenant_email || "Anonymous Tenant"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(inv as any).properties?.name} · Room {(inv as any).rooms?.room_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(inv.created_at).toLocaleDateString()} · Expires {new Date(inv.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={inv.status === "claimed" ? "default" : isExpired ? "destructive" : "secondary"}
                          className={inv.status === "claimed" ? "bg-success" : ""}>
                          {inv.status === "claimed" ? "Claimed" : isExpired ? "Expired" : inv.status === "cancelled" ? "Cancelled" : "Pending"}
                        </Badge>
                        {isPending && (
                          <>
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => copyLink(inv.invite_code)}>
                              <Copy className="w-3 h-3" /> Copy Link
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => cancelInvite(inv.id)}>
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
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

export default TenantInvitations;

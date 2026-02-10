import { useEffect, useState } from "react";
import { Users, Plus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TenantAssignment {
  id: string;
  tenant_id: string;
  room_id: string;
  property_id: string;
  move_in_date: string;
  move_out_date: string | null;
  is_active: boolean;
  rooms?: { room_number: string };
  properties?: { name: string };
  profiles?: { full_name: string; phone: string | null };
}

const Tenants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<TenantAssignment[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; room_number: string; property_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form
  const [tenantEmail, setTenantEmail] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = async () => {
    if (!user) return;
    const [assignRes, propRes, roomRes] = await Promise.all([
      supabase.from("tenant_assignments").select("*, rooms(room_number), properties(name)").order("created_at", { ascending: false }),
      supabase.from("properties").select("id, name").eq("owner_id", user.id),
      supabase.from("rooms").select("id, room_number, property_id"),
    ]);

    // Fetch profiles for assigned tenants
    const data = assignRes.data ?? [];
    const tenantIds = [...new Set(data.map(a => a.tenant_id))];
    let profilesMap: Record<string, { full_name: string; phone: string | null }> = {};
    if (tenantIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", tenantIds);
      profiles?.forEach(p => { profilesMap[p.user_id] = p; });
    }

    setAssignments(data.map(a => ({ ...a, profiles: profilesMap[a.tenant_id] })));
    setProperties(propRes.data ?? []);
    setRooms(roomRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const filteredRooms = rooms.filter(r => r.property_id === propertyId);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    // Look up tenant by email in auth - we'll search profiles
    // For now, we use a simple tenant_id input approach
    // In production, you'd want an edge function lookup
    toast({ title: "Info", description: "Enter the tenant's user ID (from their account). In a future update, you can search by email." });
  };

  const handleDeactivate = async (id: string) => {
    await supabase.from("tenant_assignments").update({
      is_active: false,
      move_out_date: new Date().toISOString().split("T")[0],
    }).eq("id", id);
    toast({ title: "Tenant moved out" });
    fetchData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tenants</h1>
            <p className="text-muted-foreground">Manage tenant assignments</p>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : assignments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tenants assigned</h3>
              <p className="text-muted-foreground">Tenants will appear here once they're assigned to rooms</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map(a => (
              <Card key={a.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-primary" />
                        {a.profiles?.full_name || "Unknown Tenant"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{a.profiles?.phone || "No phone"}</p>
                    </div>
                    <Badge variant={a.is_active ? "default" : "secondary"} className={a.is_active ? "bg-success" : ""}>
                      {a.is_active ? "Active" : "Moved Out"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Property:</span> {(a as any).properties?.name}</p>
                  <p><span className="text-muted-foreground">Room:</span> {(a as any).rooms?.room_number}</p>
                  <p><span className="text-muted-foreground">Move-in:</span> {a.move_in_date}</p>
                  {a.move_out_date && <p><span className="text-muted-foreground">Move-out:</span> {a.move_out_date}</p>}
                  {a.is_active && (
                    <Button variant="outline" size="sm" className="w-full mt-2 text-destructive" onClick={() => handleDeactivate(a.id)}>
                      Mark as Moved Out
                    </Button>
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

export default Tenants;

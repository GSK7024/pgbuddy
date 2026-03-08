import { useEffect, useState } from "react";
import { Plus, Home, Pencil, Trash2, IndianRupee } from "lucide-react";
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

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  rent_amount: number;
  deposit_amount: number | null;
  is_vacant: boolean;
  amenities: string[];
  property_id: string;
  properties?: { name: string };
}

interface Property {
  id: string;
  name: string;
}

const Rooms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [occupancyMap, setOccupancyMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [filterProperty, setFilterProperty] = useState<string>("all");

  // Form
  const [propertyId, setPropertyId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("single");
  const [capacity, setCapacity] = useState("1");
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [propRes, roomRes, assignRes] = await Promise.all([
      supabase.from("properties").select("id, name").eq("owner_id", user.id),
      supabase.from("rooms").select("*, properties(name)").order("created_at", { ascending: false }),
      supabase.from("tenant_assignments").select("room_id").eq("is_active", true),
    ]);
    setProperties(propRes.data ?? []);
    setRooms(roomRes.data ?? []);

    // Build occupancy map
    const map: Record<string, number> = {};
    (assignRes.data ?? []).forEach(a => {
      map[a.room_id] = (map[a.room_id] || 0) + 1;
    });
    setOccupancyMap(map);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const resetForm = () => {
    setPropertyId(""); setRoomNumber(""); setRoomType("single");
    setCapacity("1"); setRentAmount(""); setDepositAmount("");
    setEditingRoom(null);
  };

  const openEdit = (r: Room) => {
    setEditingRoom(r);
    setPropertyId(r.property_id); setRoomNumber(r.room_number);
    setRoomType(r.room_type); setCapacity(String(r.capacity));
    setRentAmount(String(r.rent_amount)); setDepositAmount(String(r.deposit_amount ?? ""));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) {
      toast({ title: "Error", description: "Please select a property", variant: "destructive" });
      return;
    }
    const payload = {
      property_id: propertyId,
      room_number: roomNumber,
      room_type: roomType,
      capacity: parseInt(capacity),
      rent_amount: parseFloat(rentAmount),
      deposit_amount: depositAmount ? parseFloat(depositAmount) : 0,
    };

    let error;
    if (editingRoom) {
      ({ error } = await supabase.from("rooms").update(payload).eq("id", editingRoom.id));
    } else {
      ({ error } = await supabase.from("rooms").insert(payload));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingRoom ? "Room updated!" : "Room added!" });
      setDialogOpen(false); resetForm(); fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (!error) { toast({ title: "Room deleted" }); fetchData(); }
  };

  const filtered = filterProperty === "all" ? rooms : rooms.filter(r => r.property_id === filterProperty);

  const getOccupancyBadge = (r: Room) => {
    const occupied = occupancyMap[r.id] || 0;
    const isFull = occupied >= r.capacity;
    if (occupied === 0) {
      return <Badge variant="default" className="bg-success">Vacant</Badge>;
    }
    if (isFull) {
      return <Badge variant="secondary">{occupied}/{r.capacity} Full</Badge>;
    }
    return <Badge variant="outline" className="border-warning text-warning">{occupied}/{r.capacity} Occupied</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Rooms</h1>
            <p className="text-muted-foreground">Manage rooms across properties</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filterProperty} onValueChange={setFilterProperty}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by property" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary gap-2"><Plus className="w-4 h-4" /> Add Room</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingRoom ? "Edit Room" : "Add Room"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Property *</Label>
                    <Select value={propertyId} onValueChange={setPropertyId} required>
                      <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                      <SelectContent>
                        {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Room Number *</Label>
                      <Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="101" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Room Type</Label>
                      <Select value={roomType} onValueChange={setRoomType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="double">Double</SelectItem>
                          <SelectItem value="triple">Triple</SelectItem>
                          <SelectItem value="dormitory">Dormitory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Capacity</Label>
                      <Input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Rent (₹) *</Label>
                      <Input type="number" value={rentAmount} onChange={e => setRentAmount(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Deposit (₹)</Label>
                      <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary">{editingRoom ? "Update" : "Add Room"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Home className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
              <p className="text-muted-foreground">Add rooms to your properties</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(r => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Room {r.room_number}</CardTitle>
                      <p className="text-sm text-muted-foreground">{(r as any).properties?.name}</p>
                    </div>
                    {getOccupancyBadge(r)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{r.room_type} · {r.capacity} bed(s)</span>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-bold">
                    <IndianRupee className="w-4 h-4" />
                    {Number(r.rent_amount).toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(r)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
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

export default Rooms;

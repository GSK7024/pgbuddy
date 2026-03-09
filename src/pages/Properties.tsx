import { useEffect, useState } from "react";
import { Plus, Building2, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  locality: string | null;
  description: string | null;
  amenities: string[];
  gender_preference: string | null;
  contact_phone: string | null;
  is_active: boolean;
}

const Properties = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { effectiveOwnerId, isStaff, loading: staffLoading } = useStaffAccess();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [description, setDescription] = useState("");
  const [genderPref, setGenderPref] = useState("any");
  const [contactPhone, setContactPhone] = useState("");
  const [amenitiesStr, setAmenitiesStr] = useState("");

  const fetchProperties = async () => {
    if (!effectiveOwnerId) return;
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", effectiveOwnerId)
      .order("created_at", { ascending: false });
    setProperties(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!staffLoading) fetchProperties();
  }, [effectiveOwnerId, staffLoading]);

  const resetForm = () => {
    setName(""); setAddress(""); setCity(""); setLocality("");
    setDescription(""); setGenderPref("any"); setContactPhone(""); setAmenitiesStr("");
    setEditingProperty(null);
  };

  const openEdit = (p: Property) => {
    setEditingProperty(p);
    setName(p.name); setAddress(p.address); setCity(p.city);
    setLocality(p.locality ?? ""); setDescription(p.description ?? "");
    setGenderPref(p.gender_preference ?? "any");
    setContactPhone(p.contact_phone ?? "");
    setAmenitiesStr((p.amenities ?? []).join(", "));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      name, address, city, locality: locality || null,
      description: description || null,
      gender_preference: genderPref,
      contact_phone: contactPhone || null,
      amenities: amenitiesStr.split(",").map(a => a.trim()).filter(Boolean),
      owner_id: effectiveOwnerId!,
    };

    let error;
    if (editingProperty) {
      ({ error } = await supabase.from("properties").update(payload).eq("id", editingProperty.id));
    } else {
      ({ error } = await supabase.from("properties").insert(payload));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingProperty ? "Property updated!" : "Property added!" });
      setDialogOpen(false);
      resetForm();
      fetchProperties();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Property deleted" });
      fetchProperties();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Properties</h1>
            <p className="text-muted-foreground">Manage your PG properties</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <Plus className="w-4 h-4" /> Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProperty ? "Edit Property" : "Add New Property"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Property Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sunrise PG" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Bangalore" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Locality</Label>
                    <Input value={locality} onChange={e => setLocality(e.target.value)} placeholder="e.g. Koramangala" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address *</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="About this PG..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender Preference</Label>
                    <Select value={genderPref} onValueChange={setGenderPref}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="male">Male Only</SelectItem>
                        <SelectItem value="female">Female Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+91..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Amenities (comma-separated)</Label>
                  <Input value={amenitiesStr} onChange={e => setAmenitiesStr(e.target.value)} placeholder="WiFi, AC, Food, Laundry" />
                </div>
                <Button type="submit" className="w-full gradient-primary">
                  {editingProperty ? "Update Property" : "Add Property"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : properties.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
              <p className="text-muted-foreground mb-4">Add your first PG property to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {p.locality ? `${p.locality}, ` : ""}{p.city}
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  )}
                  {p.amenities && p.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.amenities.slice(0, 4).map((a) => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{a}</span>
                      ))}
                      {p.amenities.length > 4 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{p.amenities.length - 4}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.gender_preference === "male" ? "bg-blue-100 text-blue-700" : p.gender_preference === "female" ? "bg-pink-100 text-pink-700" : "bg-muted text-muted-foreground"}`}>
                      {p.gender_preference === "any" ? "Co-ed" : p.gender_preference === "male" ? "Male" : "Female"}
                    </span>
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

export default Properties;

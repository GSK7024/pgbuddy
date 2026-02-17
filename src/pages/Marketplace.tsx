import { useEffect, useState } from "react";
import { Search, MapPin, IndianRupee, Users, Wifi, Home, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";

interface PropertyListing {
  id: string;
  name: string;
  address: string;
  city: string;
  locality: string | null;
  description: string | null;
  amenities: string[];
  gender_preference: string | null;
  contact_phone: string | null;
  rooms: { id: string; room_number: string; room_type: string; rent_amount: number; capacity: number; is_vacant: boolean }[];
}

const Marketplace = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [maxRent, setMaxRent] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, name, address, city, locality, description, amenities, gender_preference, contact_phone, rooms(id, room_number, room_type, rent_amount, capacity, is_vacant)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setProperties(data ?? []);
      setLoading(false);
    };
    fetchListings();
  }, []);

  const filtered = properties.filter(p => {
    if (searchCity && !p.city.toLowerCase().includes(searchCity.toLowerCase()) && !(p.locality ?? "").toLowerCase().includes(searchCity.toLowerCase())) return false;
    if (genderFilter !== "all" && p.gender_preference !== genderFilter && p.gender_preference !== "any") return false;
    
    const vacantRooms = p.rooms.filter(r => r.is_vacant);
    if (vacantRooms.length === 0) return false;
    
    if (maxRent) {
      const minRoomRent = Math.min(...vacantRooms.map(r => Number(r.rent_amount)));
      if (minRoomRent > Number(maxRent)) return false;
    }
    return true;
  });

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Browse PGs</h1>
          <p className="text-muted-foreground">Find your perfect paying guest accommodation</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search city or locality..."
                  value={searchCity}
                  onChange={e => setSearchCity(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Gender preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male">Male Only</SelectItem>
                  <SelectItem value="female">Female Only</SelectItem>
                  <SelectItem value="any">Co-ed</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Max rent per month"
                  value={maxRent}
                  onChange={e => setMaxRent(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <p className="text-muted-foreground">Loading listings...</p>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Home className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No PGs found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(p => {
              const vacantRooms = p.rooms.filter(r => r.is_vacant);
              const minRent = Math.min(...vacantRooms.map(r => Number(r.rent_amount)));
              const expanded = expandedId === p.id;

              return (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{p.name}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {p.locality ? `${p.locality}, ` : ""}{p.city}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        {vacantRooms.length} room{vacantRooms.length > 1 ? "s" : ""} available
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                    )}
                    
                    <div className="flex items-center gap-1 text-lg font-bold">
                      <IndianRupee className="w-4 h-4" />
                      {minRent.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">/month onwards</span>
                    </div>

                    {p.amenities && p.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.amenities.slice(0, 5).map(a => (
                          <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                        ))}
                        {p.amenities.length > 5 && (
                          <Badge variant="outline" className="text-xs">+{p.amenities.length - 5}</Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {p.gender_preference === "any" ? "Co-ed" : p.gender_preference}
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setExpandedId(expanded ? null : p.id)}
                    >
                      {expanded ? "Hide Rooms" : "View Available Rooms"}
                    </Button>

                    {expanded && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        {vacantRooms.map(r => (
                          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div>
                              <p className="font-medium text-sm">Room {r.room_number}</p>
                              <p className="text-xs text-muted-foreground capitalize">{r.room_type} · {r.capacity} bed(s)</p>
                            </div>
                            <p className="font-bold flex items-center gap-1">
                              <IndianRupee className="w-3 h-3" />
                              {Number(r.rent_amount).toLocaleString()}
                            </p>
                          </div>
                        ))}
                        {p.contact_phone && (
                          <p className="text-sm text-center text-muted-foreground pt-2">
                            Contact: <span className="font-medium text-foreground">{p.contact_phone}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-sm text-center text-muted-foreground">
          Showing {filtered.length} of {properties.length} listings
        </p>
      </div>
    </TenantLayout>
  );
};

export default Marketplace;

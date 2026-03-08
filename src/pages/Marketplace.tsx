import { useEffect, useState } from "react";
import { Search, MapPin, IndianRupee, Home, Phone, Users, Bed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

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
  const [sortBy, setSortBy] = useState("newest");

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
    if (searchCity && !p.city.toLowerCase().includes(searchCity.toLowerCase()) && !(p.locality ?? "").toLowerCase().includes(searchCity.toLowerCase()) && !p.name.toLowerCase().includes(searchCity.toLowerCase())) return false;
    if (genderFilter !== "all" && p.gender_preference !== genderFilter && p.gender_preference !== "any") return false;
    
    const vacantRooms = p.rooms.filter(r => r.is_vacant);
    if (vacantRooms.length === 0) return false;
    
    if (maxRent) {
      const minRoomRent = Math.min(...vacantRooms.map(r => Number(r.rent_amount)));
      if (minRoomRent > Number(maxRent)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVacant = a.rooms.filter(r => r.is_vacant);
    const bVacant = b.rooms.filter(r => r.is_vacant);
    const aMin = aVacant.length > 0 ? Math.min(...aVacant.map(r => Number(r.rent_amount))) : Infinity;
    const bMin = bVacant.length > 0 ? Math.min(...bVacant.map(r => Number(r.rent_amount))) : Infinity;
    if (sortBy === "price_low") return aMin - bMin;
    if (sortBy === "price_high") return bMin - aMin;
    if (sortBy === "rooms") return bVacant.length - aVacant.length;
    return 0;
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input placeholder="City, locality or name..." value={searchCity} onChange={e => setSearchCity(e.target.value)} className="pl-10" />
              </div>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger><SelectValue placeholder="Gender preference" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male">Male Only</SelectItem>
                  <SelectItem value="female">Female Only</SelectItem>
                  <SelectItem value="any">Co-ed</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type="number" placeholder="Max rent" value={maxRent} onChange={e => setMaxRent(e.target.value)} className="pl-10" />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low → High</SelectItem>
                  <SelectItem value="price_high">Price: High → Low</SelectItem>
                  <SelectItem value="rooms">Most Rooms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{sorted.length} PG{sorted.length !== 1 ? "s" : ""} found</p>
          {(searchCity || genderFilter !== "all" || maxRent) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchCity(""); setGenderFilter("all"); setMaxRent(""); }}>Clear</Button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <p className="text-muted-foreground">Loading listings...</p>
        ) : sorted.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Home className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No PGs found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map(p => {
              const vacantRooms = p.rooms.filter(r => r.is_vacant);
              const minRent = Math.min(...vacantRooms.map(r => Number(r.rent_amount)));
              const maxRentVal = Math.max(...vacantRooms.map(r => Number(r.rent_amount)));
              const expanded = expandedId === p.id;

              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="hover:shadow-md transition-all overflow-hidden">
                    <div className="h-1 gradient-primary" />
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
                          {vacantRooms.length} room{vacantRooms.length > 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold flex items-center">
                            <IndianRupee className="w-4 h-4" />{minRent.toLocaleString()}
                            {maxRentVal > minRent && <span className="text-sm font-normal text-muted-foreground ml-1">– ₹{maxRentVal.toLocaleString()}</span>}
                          </span>
                          <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />{p.gender_preference === "any" ? "Co-ed" : p.gender_preference}
                        </span>
                      </div>

                      {p.amenities && p.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.amenities.slice(0, 5).map(a => (
                            <Badge key={a} variant="outline" className="text-xs font-normal">{a}</Badge>
                          ))}
                          {p.amenities.length > 5 && <Badge variant="outline" className="text-xs font-normal">+{p.amenities.length - 5}</Badge>}
                        </div>
                      )}

                      <Button variant={expanded ? "secondary" : "outline"} size="sm" className="w-full" onClick={() => setExpandedId(expanded ? null : p.id)}>
                        {expanded ? "Hide Rooms" : "View Available Rooms"}
                      </Button>

                      <AnimatePresence>
                        {expanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <Separator className="mb-2" />
                            <div className="space-y-2">
                              {vacantRooms.map(r => (
                                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                  <div>
                                    <p className="font-medium text-sm">Room {r.room_number}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{r.room_type} · {r.capacity} bed(s)</p>
                                  </div>
                                  <p className="font-bold flex items-center gap-0.5">
                                    <IndianRupee className="w-3 h-3" />{Number(r.rent_amount).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                              {p.contact_phone && (
                                <a href={`tel:${p.contact_phone}`} className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/5 text-primary text-sm font-medium">
                                  <Phone className="w-4 h-4" />{p.contact_phone}
                                </a>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </TenantLayout>
  );
};

export default Marketplace;

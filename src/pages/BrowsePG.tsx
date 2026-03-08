import { useEffect, useState } from "react";
import { Search, MapPin, IndianRupee, Home, SlidersHorizontal, Star, Phone, Users, Bed, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface RoomInfo {
  id: string;
  room_number: string;
  room_type: string;
  rent_amount: number;
  capacity: number;
  is_vacant: boolean;
  amenities: string[] | null;
}

interface PropertyListing {
  id: string;
  name: string;
  address: string;
  city: string;
  locality: string | null;
  description: string | null;
  amenities: string[] | null;
  gender_preference: string | null;
  contact_phone: string | null;
  rooms: RoomInfo[];
}

const PropertyCard = ({ property, index }: { property: PropertyListing; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const vacantRooms = property.rooms.filter((r) => r.is_vacant);
  const minRent = vacantRooms.length > 0 ? Math.min(...vacantRooms.map((r) => Number(r.rent_amount))) : 0;
  const maxRent = vacantRooms.length > 0 ? Math.max(...vacantRooms.map((r) => Number(r.rent_amount))) : 0;
  const totalBeds = vacantRooms.reduce((s, r) => s + r.capacity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 group overflow-hidden border-border/60">
        {/* Color accent bar */}
        <div className="h-1 gradient-primary" />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg group-hover:text-primary transition-colors truncate">{property.name}</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{property.locality ? `${property.locality}, ` : ""}{property.city}</span>
              </p>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success shrink-0 font-medium">
              {vacantRooms.length} room{vacantRooms.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {property.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{property.description}</p>
          )}

          {/* Price & stats row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold flex items-center">
                  <IndianRupee className="w-4 h-4" />
                  {minRent.toLocaleString()}
                </span>
                {maxRent > minRent && (
                  <span className="text-sm text-muted-foreground">– ₹{maxRent.toLocaleString()}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">/month</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{totalBeds} bed{totalBeds !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{property.gender_preference === "any" ? "Co-ed" : property.gender_preference === "male" ? "Male" : "Female"}</span>
            </div>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.slice(0, 6).map((a) => (
                <Badge key={a} variant="outline" className="text-xs font-normal">{a}</Badge>
              ))}
              {property.amenities.length > 6 && (
                <Badge variant="outline" className="text-xs font-normal">+{property.amenities.length - 6}</Badge>
              )}
            </div>
          )}

          <Button
            variant={expanded ? "secondary" : "outline"}
            size="sm"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide Rooms" : `View ${vacantRooms.length} Available Room${vacantRooms.length !== 1 ? "s" : ""}`}
          </Button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Separator className="mb-3" />
                <div className="space-y-2">
                  {vacantRooms.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <p className="font-medium text-sm">Room {r.room_number}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {r.room_type} · {r.capacity} bed{r.capacity !== 1 ? "s" : ""}
                        </p>
                        {r.amenities && r.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.amenities.slice(0, 3).map(a => (
                              <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{a}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold flex items-center gap-0.5">
                          <IndianRupee className="w-3 h-3" />
                          {Number(r.rent_amount).toLocaleString()}
                        </p>
                        <span className="text-[10px] text-muted-foreground">/month</span>
                      </div>
                    </div>
                  ))}
                  {property.contact_phone && (
                    <a
                      href={`tel:${property.contact_phone}`}
                      className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-sm font-medium transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {property.contact_phone}
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
};

const BrowsePG = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [maxRent, setMaxRent] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, name, address, city, locality, description, amenities, gender_preference, contact_phone, rooms(id, room_number, room_type, rent_amount, capacity, is_vacant, amenities)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setProperties((data as unknown as PropertyListing[]) ?? []);
      setLoading(false);
    };
    fetchListings();
  }, []);

  const filtered = properties.filter((p) => {
    if (searchCity && !p.city.toLowerCase().includes(searchCity.toLowerCase()) && !(p.locality ?? "").toLowerCase().includes(searchCity.toLowerCase()) && !p.name.toLowerCase().includes(searchCity.toLowerCase())) return false;
    if (genderFilter !== "all" && p.gender_preference !== genderFilter && p.gender_preference !== "any") return false;

    let vacantRooms = p.rooms.filter((r) => r.is_vacant);
    if (roomTypeFilter !== "all") {
      vacantRooms = vacantRooms.filter((r) => r.room_type === roomTypeFilter);
    }
    if (vacantRooms.length === 0) return false;

    if (maxRent) {
      const minRoomRent = Math.min(...vacantRooms.map((r) => Number(r.rent_amount)));
      if (minRoomRent > Number(maxRent)) return false;
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const aVacant = a.rooms.filter(r => r.is_vacant);
    const bVacant = b.rooms.filter(r => r.is_vacant);
    const aMin = aVacant.length > 0 ? Math.min(...aVacant.map(r => Number(r.rent_amount))) : Infinity;
    const bMin = bVacant.length > 0 ? Math.min(...bVacant.map(r => Number(r.rent_amount))) : Infinity;

    if (sortBy === "price_low") return aMin - bMin;
    if (sortBy === "price_high") return bMin - aMin;
    if (sortBy === "rooms") return bVacant.length - aVacant.length;
    return 0; // newest = default order
  });

  const cities = [...new Set(properties.map(p => p.city))].sort();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 space-y-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Find Your Perfect PG</h1>
            <p className="text-muted-foreground text-lg">
              Browse verified paying guest accommodations across {cities.length > 0 ? cities.length : ""} cities
            </p>
          </div>

          {/* Filters */}
          <Card className="max-w-5xl mx-auto">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="City, locality or name..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male Only</SelectItem>
                    <SelectItem value="female">Female Only</SelectItem>
                    <SelectItem value="any">Co-ed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="Room type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                    <SelectItem value="dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Max rent"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="rooms">Most Rooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results count */}
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading..." : `${sorted.length} PG${sorted.length !== 1 ? "s" : ""} found`}
            </p>
            {(searchCity || genderFilter !== "all" || maxRent || roomTypeFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchCity(""); setGenderFilter("all"); setMaxRent(""); setRoomTypeFilter("all"); }}>
                Clear filters
              </Button>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <div className="h-1 bg-muted" />
                  <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <Card className="border-dashed max-w-lg mx-auto">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Home className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No PGs found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or check back later</p>
                <Button variant="outline" onClick={() => { setSearchCity(""); setGenderFilter("all"); setMaxRent(""); setRoomTypeFilter("all"); }}>
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {sorted.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BrowsePG;

import { useEffect, useState } from "react";
import { Search, MapPin, IndianRupee, Home, Star, Phone, Users, Bed, ArrowUpDown, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface RoomInfo {
  id: string;
  room_number: string;
  room_type: string;
  rent_amount: number;
  capacity: number;
  is_vacant: boolean;
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
  is_featured: boolean | null;
  rooms: RoomInfo[];
  coverPhoto?: string;
  avgRating?: number;
  reviewCount?: number;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={`w-3 h-3 ${i <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
    ))}
  </div>
);

const PropertyCard = ({ property, index }: { property: PropertyListing; index: number }) => {
  const vacantRooms = property.rooms.filter(r => r.is_vacant);
  const minRent = vacantRooms.length > 0 ? Math.min(...vacantRooms.map(r => Number(r.rent_amount))) : 0;
  const maxRent = vacantRooms.length > 0 ? Math.max(...vacantRooms.map(r => Number(r.rent_amount))) : 0;
  const totalBeds = vacantRooms.reduce((s, r) => s + r.capacity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link to={`/pg/${property.id}`}>
        <Card className="hover:shadow-lg transition-all duration-300 group overflow-hidden border-border/60 cursor-pointer">
          {/* Cover Photo */}
          <div className="relative h-48 bg-muted overflow-hidden">
            {property.coverPhoto ? (
              <img src={property.coverPhoto} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <Home className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            {/* Price overlay */}
            <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <div className="flex items-baseline gap-0.5">
                <IndianRupee className="w-3 h-3" />
                <span className="font-bold">{minRent.toLocaleString()}</span>
                {maxRent > minRent && <span className="text-xs opacity-80"> – ₹{maxRent.toLocaleString()}</span>}
              </div>
              <span className="text-[10px] opacity-70">/month</span>
            </div>
            {/* Badges */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
              {property.is_featured && (
                <Badge className="bg-warning text-warning-foreground gap-1">
                  <Crown className="w-3 h-3" /> Featured
                </Badge>
              )}
              <Badge className="bg-success text-white">
                {vacantRooms.length} room{vacantRooms.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4 space-y-2.5">
            <div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">{property.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{property.locality ? `${property.locality}, ` : ""}{property.city}</span>
              </p>
            </div>

            {/* Rating + stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {property.avgRating && property.avgRating > 0 ? (
                  <>
                    <StarRating rating={Math.round(property.avgRating)} />
                    <span className="text-xs font-medium">{property.avgRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({property.reviewCount})</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">No reviews yet</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{totalBeds}</span>
                <span>{property.gender_preference === "any" ? "Co-ed" : property.gender_preference === "male" ? "Male" : "Female"}</span>
              </div>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {property.amenities.slice(0, 4).map(a => (
                  <Badge key={a} variant="outline" className="text-[10px] font-normal">{a}</Badge>
                ))}
                {property.amenities.length > 4 && (
                  <Badge variant="outline" className="text-[10px] font-normal">+{property.amenities.length - 4}</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
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
      const [propRes, photosRes, reviewsRes] = await Promise.all([
        supabase
          .from("properties")
          .select("id, name, address, city, locality, description, amenities, gender_preference, contact_phone, is_featured, rooms(id, room_number, room_type, rent_amount, capacity, is_vacant)")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase.from("property_photos").select("property_id, url, is_cover").eq("is_cover", true),
        supabase.from("property_reviews").select("property_id, rating"),
      ]);

      const coverMap: Record<string, string> = {};
      (photosRes.data ?? []).forEach(p => { coverMap[p.property_id] = p.url; });

      // Also get first photo as fallback
      const { data: allPhotos } = await supabase.from("property_photos").select("property_id, url").order("display_order").limit(100);
      const fallbackMap: Record<string, string> = {};
      (allPhotos ?? []).forEach(p => { if (!fallbackMap[p.property_id]) fallbackMap[p.property_id] = p.url; });

      const ratingMap: Record<string, { total: number; count: number }> = {};
      (reviewsRes.data ?? []).forEach(r => {
        if (!ratingMap[r.property_id]) ratingMap[r.property_id] = { total: 0, count: 0 };
        ratingMap[r.property_id].total += r.rating;
        ratingMap[r.property_id].count += 1;
      });

      const listings = ((propRes.data ?? []) as unknown as PropertyListing[]).map(p => ({
        ...p,
        coverPhoto: coverMap[p.id] || fallbackMap[p.id] || undefined,
        avgRating: ratingMap[p.id] ? ratingMap[p.id].total / ratingMap[p.id].count : 0,
        reviewCount: ratingMap[p.id]?.count ?? 0,
      }));

      setProperties(listings);
      setLoading(false);
    };
    fetchListings();
  }, []);

  const filtered = properties.filter(p => {
    if (searchCity && !p.city.toLowerCase().includes(searchCity.toLowerCase()) && !(p.locality ?? "").toLowerCase().includes(searchCity.toLowerCase()) && !p.name.toLowerCase().includes(searchCity.toLowerCase())) return false;
    if (genderFilter !== "all" && p.gender_preference !== genderFilter && p.gender_preference !== "any") return false;
    let vacantRooms = p.rooms.filter(r => r.is_vacant);
    if (roomTypeFilter !== "all") vacantRooms = vacantRooms.filter(r => r.room_type === roomTypeFilter);
    if (vacantRooms.length === 0) return false;
    if (maxRent) {
      const minRoomRent = Math.min(...vacantRooms.map(r => Number(r.rent_amount)));
      if (minRoomRent > Number(maxRent)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    // Featured properties always come first
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;

    const aVacant = a.rooms.filter(r => r.is_vacant);
    const bVacant = b.rooms.filter(r => r.is_vacant);
    const aMin = aVacant.length > 0 ? Math.min(...aVacant.map(r => Number(r.rent_amount))) : Infinity;
    const bMin = bVacant.length > 0 ? Math.min(...bVacant.map(r => Number(r.rent_amount))) : Infinity;
    if (sortBy === "price_low") return aMin - bMin;
    if (sortBy === "price_high") return bMin - aMin;
    if (sortBy === "rooms") return bVacant.length - aVacant.length;
    if (sortBy === "rating") return (b.avgRating || 0) - (a.avgRating || 0);
    return 0;
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
                  <Input placeholder="City, locality or name..." value={searchCity} onChange={e => setSearchCity(e.target.value)} className="pl-10" />
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
                  <Input type="number" placeholder="Max rent" value={maxRent} onChange={e => setMaxRent(e.target.value)} className="pl-10" />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {sorted.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          )}

          {/* City links for SEO */}
          <div className="max-w-5xl mx-auto pt-8">
            <h2 className="text-lg font-semibold mb-4 text-center">Browse PGs by City</h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Mumbai", "Pune", "Bangalore", "Delhi", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Nagpur", "Nashik"].map(c => (
                <Link key={c} to={`/pgs/${c.toLowerCase()}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors">{c}</Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BrowsePG;

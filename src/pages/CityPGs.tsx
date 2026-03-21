import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Search, Home, IndianRupee, Star, Bed, Crown, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const cityData: Record<string, { title: string; description: string }> = {
  mumbai: { title: "Best PGs in Mumbai", description: "Find affordable and verified PG accommodations across Mumbai - Andheri, Powai, Bandra, Thane and more." },
  pune: { title: "Best PGs in Pune", description: "Discover top-rated PGs in Pune near Hinjewadi, Kothrud, Viman Nagar, and other IT hubs." },
  bangalore: { title: "Best PGs in Bangalore", description: "Find the perfect PG in Bangalore near Koramangala, Whitefield, Electronic City, and HSR Layout." },
  delhi: { title: "Best PGs in Delhi NCR", description: "Browse verified PG accommodations in Delhi, Noida, Gurgaon, and Greater Noida." },
  hyderabad: { title: "Best PGs in Hyderabad", description: "Discover affordable PGs in Hyderabad near HITEC City, Gachibowli, Madhapur, and Kondapur." },
  chennai: { title: "Best PGs in Chennai", description: "Find comfortable PGs in Chennai near OMR, Velachery, T Nagar, and Anna Nagar." },
  kolkata: { title: "Best PGs in Kolkata", description: "Browse PG accommodations in Kolkata near Salt Lake, New Town, Park Street, and Howrah." },
  ahmedabad: { title: "Best PGs in Ahmedabad", description: "Find verified PGs in Ahmedabad near SG Highway, Prahlad Nagar, and Satellite." },
  nagpur: { title: "Best PGs in Nagpur", description: "Discover affordable PGs in Nagpur near Dharampeth, Sitabuldi, and Sadar." },
  nashik: { title: "Best PGs in Nashik", description: "Find comfortable PG accommodations in Nashik for students and professionals." },
};

const CityPGs = () => {
  const { city } = useParams<{ city: string }>();
  const cityInfo = cityData[city?.toLowerCase() || ""] || {
    title: `PGs in ${city}`,
    description: `Find verified PG accommodations in ${city}.`,
  };

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;
    const fetchProps = async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, name, address, city, locality, amenities, gender_preference, is_featured, rooms(id, rent_amount, is_vacant, capacity)")
        .eq("is_active", true)
        .ilike("city", `%${city}%`);

      const { data: photos } = await supabase.from("property_photos").select("property_id, url, is_cover");
      const coverMap: Record<string, string> = {};
      (photos ?? []).forEach(p => { if (p.is_cover || !coverMap[p.property_id]) coverMap[p.property_id] = p.url; });

      setProperties((data ?? []).map(p => ({ ...p, coverPhoto: coverMap[p.id] })));
      setLoading(false);
    };
    fetchProps();
  }, [city]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={cityInfo.title}
        description={cityInfo.description}
        canonical={`/pgs/${city?.toLowerCase()}`}
      />
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 space-y-8">
          {/* SEO Hero */}
          <div className="max-w-3xl mx-auto text-center">
            <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-primary mb-4 hover:underline">
              <ArrowLeft className="w-3 h-3" /> Back to all cities
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{cityInfo.title}</h1>
            <p className="text-muted-foreground text-lg">{cityInfo.description}</p>
          </div>

          {/* Quick city links */}
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.keys(cityData).map(c => (
              <Link key={c} to={`/pgs/${c}`}>
                <Badge variant={c === city?.toLowerCase() ? "default" : "outline"} className={`cursor-pointer capitalize ${c === city?.toLowerCase() ? "gradient-primary text-primary-foreground" : ""}`}>
                  {c}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {[1, 2, 3].map(i => (
                <Card key={i}><Skeleton className="h-48 w-full" /><CardContent className="p-4"><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <Card className="max-w-lg mx-auto border-dashed">
              <CardContent className="py-12 text-center">
                <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No PGs found in {city}</h3>
                <p className="text-muted-foreground mb-4">Be the first to list your PG here!</p>
                <Button className="gradient-primary" asChild>
                  <Link to="/auth?mode=signup&role=owner">List Your PG</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {properties.map((p, i) => {
                const vacantRooms = (p.rooms || []).filter((r: any) => r.is_vacant);
                const minRent = vacantRooms.length > 0 ? Math.min(...vacantRooms.map((r: any) => Number(r.rent_amount))) : 0;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link to={`/pg/${p.id}`}>
                      <Card className="hover:shadow-lg transition-all group overflow-hidden cursor-pointer">
                        <div className="relative h-44 bg-muted">
                          {p.coverPhoto ? (
                            <img src={p.coverPhoto} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                              <Home className="w-10 h-10 text-muted-foreground/30" />
                            </div>
                          )}
                          {minRent > 0 && (
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-sm font-bold flex items-center gap-0.5">
                              <IndianRupee className="w-3 h-3" />{minRent.toLocaleString()}<span className="text-[10px] opacity-70">/mo</span>
                            </div>
                          )}
                          {p.is_featured && (
                            <Badge className="absolute top-2 right-2 bg-warning text-warning-foreground gap-1"><Crown className="w-3 h-3" /> Featured</Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">{p.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />{p.locality ? `${p.locality}, ` : ""}{p.city}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px]">{vacantRooms.length} rooms available</Badge>
                            <span>{p.gender_preference === "any" ? "Co-ed" : p.gender_preference}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* SEO content */}
          <div className="max-w-3xl mx-auto prose prose-sm text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Finding PG Accommodation in {city}</h2>
            <p>
              Looking for a PG in {city}? PG Buddy helps you find verified, safe, and affordable paying guest 
              accommodations. Browse through our listings with detailed photos, amenities, pricing, and tenant reviews 
              to find the perfect place that suits your budget and lifestyle.
            </p>
            <p>
              All PGs listed on PG Buddy are verified by property owners who actively manage their properties 
              through our platform, ensuring up-to-date availability and transparent pricing.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CityPGs;

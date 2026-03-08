import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, IndianRupee, Star, Phone, Users, Bed, ChevronLeft, ChevronRight, Play, Send, ArrowLeft, Wifi, Shield, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface PropertyData {
  id: string;
  name: string;
  address: string;
  city: string;
  locality: string | null;
  description: string | null;
  amenities: string[] | null;
  gender_preference: string | null;
  contact_phone: string | null;
  rules: string | null;
  video_url: string | null;
}

interface RoomData {
  id: string;
  room_number: string;
  room_type: string;
  rent_amount: number;
  capacity: number;
  is_vacant: boolean;
  amenities: string[] | null;
  deposit_amount: number | null;
}

interface PhotoData {
  id: string;
  url: string;
  caption: string | null;
  is_cover: boolean;
  display_order: number;
}

interface ReviewData {
  id: string;
  rating: number;
  review_text: string | null;
  is_anonymous: boolean;
  created_at: string;
  profiles?: { full_name: string } | null;
}

const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) => {
  const sz = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${sz} ${i <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
};

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);

  // Enquiry form
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [propRes, roomRes, photoRes, reviewRes] = await Promise.all([
        supabase.from("properties").select("id, name, address, city, locality, description, amenities, gender_preference, contact_phone, rules, video_url").eq("id", id).single(),
        supabase.from("rooms").select("*").eq("property_id", id).eq("is_vacant", true).order("room_number"),
        supabase.from("property_photos").select("*").eq("property_id", id).order("display_order"),
        supabase.from("property_reviews").select("id, rating, review_text, is_anonymous, created_at, tenant_id").eq("property_id", id).order("created_at", { ascending: false }),
      ]);

      setProperty(propRes.data as unknown as PropertyData);
      setRooms((roomRes.data ?? []) as unknown as RoomData[]);
      setPhotos((photoRes.data ?? []) as unknown as PhotoData[]);

      // Fetch reviewer profiles
      const reviewData = reviewRes.data ?? [];
      const tenantIds = reviewData.filter(r => !(r as any).is_anonymous).map(r => (r as any).tenant_id);
      let profilesMap: Record<string, { full_name: string }> = {};
      if (tenantIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", tenantIds);
        profiles?.forEach(p => { profilesMap[p.user_id] = p; });
      }
      setReviews(reviewData.map(r => ({
        ...(r as any),
        profiles: (r as any).is_anonymous ? null : profilesMap[(r as any).tenant_id] || null,
      })));

      setLoading(false);
    };
    fetchData();
  }, [id]);

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const vacantRooms = rooms;
  const minRent = vacantRooms.length > 0 ? Math.min(...vacantRooms.map(r => Number(r.rent_amount))) : 0;
  const maxRent = vacantRooms.length > 0 ? Math.max(...vacantRooms.map(r => Number(r.rent_amount))) : 0;

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingEnquiry(true);
    const { error } = await supabase.from("property_enquiries").insert({
      property_id: id,
      visitor_name: visitorName.trim(),
      visitor_phone: visitorPhone.trim(),
      visitor_email: visitorEmail.trim() || null,
      message: enquiryMessage.trim() || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Enquiry sent!", description: "The owner will contact you soon." });
      setVisitorName(""); setVisitorPhone(""); setVisitorEmail(""); setEnquiryMessage("");
    }
    setSubmittingEnquiry(false);
  };

  const getVideoEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-[400px] bg-muted rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-6 w-48 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
              <div className="h-64 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Property not found</h1>
          <Button asChild><Link to="/browse">Browse All PGs</Link></Button>
        </div>
      </div>
    );
  }

  const placeholderImg = "/placeholder.svg";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        {/* Back button */}
        <div className="container mx-auto px-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/browse"><ArrowLeft className="w-4 h-4 mr-1" /> Back to listings</Link>
          </Button>
        </div>

        {/* Photo Gallery */}
        <div className="container mx-auto px-4 mb-8">
          {photos.length > 0 ? (
            <div className="relative rounded-xl overflow-hidden bg-muted cursor-pointer group" onClick={() => setLightboxOpen(true)}>
              <img
                src={photos[currentPhoto]?.url || placeholderImg}
                alt={photos[currentPhoto]?.caption || property.name}
                className="w-full h-[300px] md:h-[450px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {/* Photo count overlay */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-sm">
                {currentPhoto + 1} / {photos.length}
              </div>
              {/* Nav arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentPhoto(p => p === 0 ? photos.length - 1 : p - 1); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentPhoto(p => p === photos.length - 1 ? 0 : p + 1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {/* Thumbnail strip */}
              {photos.length > 1 && (
                <div className="absolute bottom-4 left-4 flex gap-1.5">
                  {photos.slice(0, 6).map((p, i) => (
                    <button
                      key={p.id}
                      onClick={(e) => { e.stopPropagation(); setCurrentPhoto(i); }}
                      className={`w-12 h-9 rounded overflow-hidden border-2 transition-all ${currentPhoto === i ? "border-white" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-[300px] md:h-[400px] rounded-xl bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">No photos available</p>
            </div>
          )}
        </div>

        {/* Lightbox */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl p-0 bg-black border-none">
            <div className="relative">
              <img
                src={photos[currentPhoto]?.url || placeholderImg}
                alt=""
                className="w-full max-h-[80vh] object-contain"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPhoto(p => p === 0 ? photos.length - 1 : p - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPhoto(p => p === photos.length - 1 ? 0 : p + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {photos[currentPhoto]?.caption && (
                <div className="absolute bottom-4 left-4 right-4 text-white text-sm bg-black/50 p-2 rounded backdrop-blur-sm">
                  {photos[currentPhoto].caption}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Content */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{property.name}</h1>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {property.address}, {property.locality ? `${property.locality}, ` : ""}{property.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold flex items-center"><IndianRupee className="w-5 h-5" />{minRent.toLocaleString()}</span>
                      {maxRent > minRent && <span className="text-muted-foreground">– ₹{maxRent.toLocaleString()}</span>}
                    </div>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>
                {/* Rating & tags */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={Math.round(avgRating)} />
                      <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                    </div>
                  )}
                  <Badge variant="outline">{property.gender_preference === "any" ? "Co-ed" : property.gender_preference === "male" ? "Male Only" : "Female Only"}</Badge>
                  <Badge variant="secondary" className="bg-success/10 text-success">{vacantRooms.length} rooms available</Badge>
                </div>
              </div>

              <Separator />

              {/* Description */}
              {property.description && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">About this PG</h2>
                  <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.amenities.map(a => (
                      <div key={a} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                        <Wifi className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Available Rooms */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Available Rooms</h2>
                {vacantRooms.length === 0 ? (
                  <p className="text-muted-foreground">No rooms available right now.</p>
                ) : (
                  <div className="space-y-3">
                    {vacantRooms.map(room => (
                      <Card key={room.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="space-y-1">
                            <p className="font-semibold">Room {room.room_number}</p>
                            <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                              <Bed className="w-3.5 h-3.5" /> {room.room_type} · {room.capacity} bed{room.capacity !== 1 ? "s" : ""}
                            </p>
                            {room.amenities && room.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {room.amenities.map(a => (
                                  <Badge key={a} variant="outline" className="text-[10px] font-normal">{a}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold flex items-center gap-0.5">
                              <IndianRupee className="w-4 h-4" />{Number(room.rent_amount).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">/month</p>
                            {room.deposit_amount && Number(room.deposit_amount) > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">Deposit: ₹{Number(room.deposit_amount).toLocaleString()}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Tour */}
              {property.video_url && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Play className="w-5 h-5 text-primary" /> Virtual Tour
                    </h2>
                    <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                      <iframe
                        src={getVideoEmbedUrl(property.video_url)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Rules */}
              {property.rules && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" /> House Rules
                    </h2>
                    <p className="text-muted-foreground whitespace-pre-line">{property.rules}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Reviews */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Reviews {reviews.length > 0 && `(${reviews.length})`}
                </h2>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card>
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm">{r.is_anonymous ? "Anonymous" : r.profiles?.full_name || "Tenant"}</p>
                                <StarRating rating={r.rating} />
                              </div>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {r.review_text && <p className="text-sm text-muted-foreground mt-2">{r.review_text}</p>}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Enquiry & Contact */}
            <div className="space-y-6">
              {/* Enquiry Form */}
              <Card className="sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Interested? Get in touch</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEnquiry} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Your Name *</Label>
                      <Input value={visitorName} onChange={e => setVisitorName(e.target.value)} placeholder="Full name" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone *</Label>
                      <Input value={visitorPhone} onChange={e => setVisitorPhone(e.target.value)} placeholder="+91..." required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email</Label>
                      <Input type="email" value={visitorEmail} onChange={e => setVisitorEmail(e.target.value)} placeholder="your@email.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Message</Label>
                      <Textarea value={enquiryMessage} onChange={e => setEnquiryMessage(e.target.value)} placeholder="I'm interested in this PG..." rows={3} />
                    </div>
                    <Button type="submit" className="w-full gradient-primary" disabled={submittingEnquiry}>
                      <Send className="w-4 h-4 mr-2" />
                      {submittingEnquiry ? "Sending..." : "Send Enquiry"}
                    </Button>
                  </form>

                  {property.contact_phone && (
                    <>
                      <Separator className="my-4" />
                      <a
                        href={`tel:${property.contact_phone}`}
                        className="flex items-center justify-center gap-2 p-3 rounded-lg bg-success/10 hover:bg-success/20 text-success font-medium transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Call: {property.contact_phone}
                      </a>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PropertyDetail;

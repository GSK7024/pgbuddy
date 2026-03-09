import { useEffect, useState } from "react";
import { Camera, Trash2, Video, Eye, MessageSquare, Lock, Crown, Mail, Phone as PhoneIcon, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionPlan } from "@/hooks/useSubscriptionPlan";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { Link } from "react-router-dom";

interface Photo {
  id: string;
  url: string;
  storage_path: string;
  caption: string | null;
  is_cover: boolean;
  display_order: number;
}

interface Enquiry {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_email: string | null;
  message: string | null;
  status: string;
  created_at: string;
  property_id: string;
  properties?: { name: string };
}

interface PropertyBasic {
  id: string;
  name: string;
  video_url: string | null;
  is_featured: boolean | null;
}

const UpgradeBanner = ({ feature, requiredPlan }: { feature: string; requiredPlan: string }) => (
  <Alert className="border-primary/30 bg-primary/5">
    <Lock className="w-4 h-4 text-primary" />
    <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
      <span className="text-sm">
        <strong>{feature}</strong> is available on the <Badge variant="secondary" className="mx-1">{requiredPlan}</Badge> plan and above.
      </span>
      <Button size="sm" asChild className="gradient-primary">
        <Link to="/dashboard/subscription"><Crown className="w-3.5 h-3.5 mr-1" /> Upgrade</Link>
      </Button>
    </AlertDescription>
  </Alert>
);

const ManageListing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { limits, isPro, isBusiness } = useSubscriptionPlan();
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const [properties, setProperties] = useState<PropertyBasic[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!effectiveOwnerId || staffLoading) return;
    const fetchProperties = async () => {
      const { data } = await supabase.from("properties").select("id, name, video_url, is_featured").eq("owner_id", effectiveOwnerId);
      setProperties((data ?? []) as PropertyBasic[]);
      if (data && data.length > 0) {
        setSelectedProperty(data[0].id);
      }
      setLoading(false);
    };
    fetchProperties();
  }, [user]);

  useEffect(() => {
    if (!selectedProperty) return;
    const fetchData = async () => {
      const [photoRes, enquiryRes] = await Promise.all([
        supabase.from("property_photos").select("*").eq("property_id", selectedProperty).order("display_order"),
        supabase.from("property_enquiries").select("*, properties(name)").eq("property_id", selectedProperty).order("created_at", { ascending: false }),
      ]);
      setPhotos(photoRes.data ?? []);
      setEnquiries(enquiryRes.data ?? []);
      const prop = properties.find(p => p.id === selectedProperty);
      setVideoUrl(prop?.video_url || "");
    };
    fetchData();
  }, [selectedProperty, properties]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedProperty) return;

    // Check plan photo limit
    const remainingSlots = limits.maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Photo limit reached",
        description: `Your ${limits.name} plan allows up to ${limits.maxPhotos} photos. Upgrade to add more.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const files = Array.from(e.target.files).slice(0, remainingSlots);

    if (files.length < e.target.files.length) {
      toast({
        title: "Some photos skipped",
        description: `Only ${remainingSlots} more photo(s) allowed on your ${limits.name} plan.`,
      });
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB limit`, variant: "destructive" });
        continue;
      }
      const ext = file.name.split(".").pop();
      const storagePath = `${selectedProperty}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from("property-photos").upload(storagePath, file);
      if (uploadErr) {
        toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage.from("property-photos").getPublicUrl(storagePath);

      await supabase.from("property_photos").insert({
        property_id: selectedProperty,
        url: urlData.publicUrl,
        storage_path: storagePath,
        is_cover: photos.length === 0,
        display_order: photos.length,
      });
    }

    const { data } = await supabase.from("property_photos").select("*").eq("property_id", selectedProperty).order("display_order");
    setPhotos(data ?? []);
    setUploading(false);
    e.target.value = "";
    toast({ title: "Photos uploaded!" });
  };

  const deletePhoto = async (photo: Photo) => {
    await supabase.storage.from("property-photos").remove([photo.storage_path]);
    await supabase.from("property_photos").delete().eq("id", photo.id);
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
    toast({ title: "Photo deleted" });
  };

  const setCover = async (photo: Photo) => {
    await supabase.from("property_photos").update({ is_cover: false }).eq("property_id", selectedProperty);
    await supabase.from("property_photos").update({ is_cover: true }).eq("id", photo.id);
    setPhotos(prev => prev.map(p => ({ ...p, is_cover: p.id === photo.id })));
    toast({ title: "Cover photo updated" });
  };

  const saveVideoUrl = async () => {
    setSavingVideo(true);
    const { error } = await supabase.from("properties").update({ video_url: videoUrl || null }).eq("id", selectedProperty);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProperties(prev => prev.map(p => p.id === selectedProperty ? { ...p, video_url: videoUrl || null } : p));
      toast({ title: "Video URL saved!" });
    }
    setSavingVideo(false);
  };

  const toggleFeatured = async () => {
    if (!isBusiness) return;
    const current = properties.find(p => p.id === selectedProperty);
    const newVal = !(current?.is_featured);
    const { error } = await supabase.from("properties").update({ is_featured: newVal }).eq("id", selectedProperty);
    if (!error) {
      setProperties(prev => prev.map(p => p.id === selectedProperty ? { ...p, is_featured: newVal } : p));
      toast({ title: newVal ? "Listing marked as Featured!" : "Featured badge removed" });
    }
  };

  const updateEnquiryStatus = async (id: string, status: string) => {
    await supabase.from("property_enquiries").update({ status }).eq("id", id);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    toast({ title: `Enquiry marked as ${status}` });
  };

  const currentProp = properties.find(p => p.id === selectedProperty);
  const photosAtLimit = photos.length >= limits.maxPhotos;

  // Enquiry analytics (Business only)
  const newCount = enquiries.filter(e => e.status === "new").length;
  const contactedCount = enquiries.filter(e => e.status === "contacted").length;
  const totalCount = enquiries.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Manage Listing</h1>
            <p className="text-muted-foreground">Photos, video tour & enquiries for your properties</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs gap-1">
              <Crown className="w-3 h-3" /> {limits.name} Plan
            </Badge>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select property" /></SelectTrigger>
              <SelectContent>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Featured toggle (Business only) */}
        {selectedProperty && isBusiness && (
          <Alert className={`cursor-pointer transition-colors ${currentProp?.is_featured ? "border-warning/50 bg-warning/5" : "border-border"}`} onClick={toggleFeatured}>
            <Crown className={`w-4 h-4 ${currentProp?.is_featured ? "text-warning" : "text-muted-foreground"}`} />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">
                {currentProp?.is_featured ? "This property is marked as Featured — it gets a badge and priority on the browse page." : "Click to mark this property as Featured for higher visibility."}
              </span>
              <Badge variant={currentProp?.is_featured ? "default" : "outline"} className={currentProp?.is_featured ? "bg-warning text-warning-foreground" : ""}>
                {currentProp?.is_featured ? "Featured ✓" : "Enable Featured"}
              </Badge>
            </AlertDescription>
          </Alert>
        )}

        {!selectedProperty ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Select a property or add one first.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="photos">
            <TabsList>
              <TabsTrigger value="photos" className="gap-1.5"><Camera className="w-4 h-4" /> Photos</TabsTrigger>
              <TabsTrigger value="video" className="gap-1.5"><Video className="w-4 h-4" /> Video Tour {!limits.videoTour && <Lock className="w-3 h-3 ml-0.5" />}</TabsTrigger>
              <TabsTrigger value="enquiries" className="gap-1.5">
                <MessageSquare className="w-4 h-4" /> Enquiries
                {newCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{newCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Photos Tab */}
            <TabsContent value="photos" className="space-y-4 mt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-muted-foreground">
                  {photos.length} / {limits.maxPhotos === Infinity ? "∞" : limits.maxPhotos} photos uploaded
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/pg/${selectedProperty}`} target="_blank"><Eye className="w-4 h-4 mr-1" /> Preview Listing</Link>
                </Button>
              </div>

              {photosAtLimit && limits.maxPhotos !== Infinity && (
                <UpgradeBanner
                  feature={`More than ${limits.maxPhotos} photos`}
                  requiredPlan={limits.slug === "free" ? "Pro" : "Business"}
                />
              )}

              {/* Upload area */}
              <Label htmlFor="photo-upload" className={`cursor-pointer ${photosAtLimit ? "pointer-events-none opacity-50" : ""}`}>
                <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors">
                  <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">{uploading ? "Uploading..." : photosAtLimit ? "Photo limit reached" : "Click to upload photos"}</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — Max 10MB each</p>
                </div>
              </Label>
              <input id="photo-upload" type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoUpload} disabled={uploading || photosAtLimit} />

              {/* Photo grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                      <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover" />
                      {photo.is_cover && (
                        <Badge className="absolute top-2 left-2 text-[10px]">Cover</Badge>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!photo.is_cover && (
                          <Button size="sm" variant="secondary" className="text-xs" onClick={() => setCover(photo)}>
                            Set Cover
                          </Button>
                        )}
                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => deletePhoto(photo)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Video Tab */}
            <TabsContent value="video" className="space-y-4 mt-4">
              {!limits.videoTour ? (
                <UpgradeBanner feature="Video Tour" requiredPlan="Pro" />
              ) : (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>YouTube Video URL</Label>
                      <Input
                        value={videoUrl}
                        onChange={e => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-muted-foreground">Paste a YouTube link for a virtual tour of your property</p>
                    </div>
                    <Button onClick={saveVideoUrl} disabled={savingVideo} className="gradient-primary">
                      {savingVideo ? "Saving..." : "Save Video URL"}
                    </Button>
                    {videoUrl && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted mt-4">
                        <iframe
                          src={videoUrl.replace("watch?v=", "embed/")}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Enquiries Tab */}
            <TabsContent value="enquiries" className="space-y-4 mt-4">
              {/* Analytics bar (Business only) */}
              {isBusiness && totalCount > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-2xl font-bold">{totalCount}</p>
                      <p className="text-xs text-muted-foreground">Total Enquiries</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-2xl font-bold text-primary">{newCount}</p>
                      <p className="text-xs text-muted-foreground">New</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-2xl font-bold text-success">{contactedCount}</p>
                      <p className="text-xs text-muted-foreground">Contacted</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!isBusiness && totalCount > 0 && (
                <UpgradeBanner feature="Enquiry Analytics" requiredPlan="Business" />
              )}

              {enquiries.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No enquiries yet. Share your listing to get visitors!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {enquiries.map(e => (
                    <Card key={e.id} className={e.status === "new" ? "border-primary/30" : ""}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{e.visitor_name}</p>
                              <Badge variant="secondary" className={`text-[10px] ${e.status === "new" ? "bg-primary/10 text-primary" : e.status === "contacted" ? "bg-success/10 text-success" : "bg-muted"}`}>
                                {e.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              <span className="flex items-center gap-1"><PhoneIcon className="w-3 h-3" />{e.visitor_phone}</span>
                              {e.visitor_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{e.visitor_email}</span>}
                            </div>
                            {e.message && <p className="text-sm text-muted-foreground">{e.message}</p>}
                            <p className="text-[10px] text-muted-foreground mt-1">{new Date(e.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {e.status === "new" && (
                              <Button size="sm" variant="outline" className="text-xs" onClick={() => updateEnquiryStatus(e.id, "contacted")}>
                                Mark Contacted
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-xs" asChild>
                              <a href={`tel:${e.visitor_phone}`}><PhoneIcon className="w-3 h-3" /></a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageListing;

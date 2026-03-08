import { useEffect, useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Assignment {
  property_id: string;
  properties?: { name: string };
}

interface Review {
  id: string;
  property_id: string;
  rating: number;
  review_text: string | null;
  is_anonymous: boolean;
  created_at: string;
}

const TenantReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [selectedProperty, setSelectedProperty] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [assignRes, reviewRes] = await Promise.all([
        supabase.from("tenant_assignments").select("property_id, properties(name)").eq("tenant_id", user.id),
        supabase.from("property_reviews").select("*").eq("tenant_id", user.id),
      ]);
      const assigns = assignRes.data ?? [];
      // Deduplicate by property_id
      const unique = assigns.filter((a, i, arr) => arr.findIndex(x => x.property_id === a.property_id) === i);
      setAssignments(unique as unknown as Assignment[]);
      setReviews(reviewRes.data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const existingReview = (propId: string) => reviews.find(r => r.property_id === propId);

  const handleSubmit = async (propertyId: string) => {
    if (!user || rating === 0) return;
    setSubmitting(true);

    const existing = existingReview(propertyId);
    if (existing) {
      const { error } = await supabase.from("property_reviews").update({
        rating,
        review_text: reviewText || null,
        is_anonymous: isAnonymous,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Review updated!" });
        setReviews(prev => prev.map(r => r.id === existing.id ? { ...r, rating, review_text: reviewText || null, is_anonymous: isAnonymous } : r));
      }
    } else {
      const { data, error } = await supabase.from("property_reviews").insert({
        property_id: propertyId,
        tenant_id: user.id,
        rating,
        review_text: reviewText || null,
        is_anonymous: isAnonymous,
      }).select().single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Review submitted!" });
        setReviews(prev => [...prev, data]);
      }
    }
    setSubmitting(false);
    setRating(0);
    setReviewText("");
    setSelectedProperty("");
  };

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">Rate and review your PG experience</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : assignments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">You haven't been assigned to any property yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map(a => {
              const existing = existingReview(a.property_id);
              const isEditing = selectedProperty === a.property_id;

              return (
                <Card key={a.property_id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{(a as any).properties?.name || "Property"}</CardTitle>
                      {existing && !isEditing && (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} className={`w-4 h-4 ${i <= existing.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
                            ))}
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
                            setSelectedProperty(a.property_id);
                            setRating(existing.rating);
                            setReviewText(existing.review_text || "");
                            setIsAnonymous(existing.is_anonymous);
                          }}>
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {existing && !isEditing ? (
                      <div>
                        {existing.review_text && <p className="text-sm text-muted-foreground">{existing.review_text}</p>}
                        <p className="text-xs text-muted-foreground mt-2">
                          Posted {new Date(existing.created_at).toLocaleDateString()}
                          {existing.is_anonymous && " · Anonymous"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {!isEditing && (
                          <Button variant="outline" size="sm" onClick={() => setSelectedProperty(a.property_id)}>
                            Write a Review
                          </Button>
                        )}
                        {isEditing && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-sm">Your Rating</Label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <button
                                    key={i}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(i)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(i)}
                                  >
                                    <Star className={`w-7 h-7 transition-colors ${
                                      i <= (hoverRating || rating) ? "fill-warning text-warning" : "text-muted-foreground/30 hover:text-warning/50"
                                    }`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Your Review (optional)</Label>
                              <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience..." rows={3} />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                              <Label className="text-sm">Post anonymously</Label>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => handleSubmit(a.property_id)} disabled={rating === 0 || submitting} className="gradient-primary">
                                <Send className="w-4 h-4 mr-1" />
                                {submitting ? "Submitting..." : existing ? "Update Review" : "Submit Review"}
                              </Button>
                              <Button variant="ghost" onClick={() => { setSelectedProperty(""); setRating(0); setReviewText(""); }}>
                                Cancel
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TenantLayout>
  );
};

export default TenantReviews;

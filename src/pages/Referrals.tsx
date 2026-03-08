import { useState, useEffect } from "react";
import { Gift, Copy, Check, Share2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const Referrals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Get or create referral code
      const { data: existing } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (existing && existing.length > 0) {
        setReferralCode(existing[0].referral_code);
        setReferrals(existing);
      } else {
        // Create first referral entry as the code holder
        const { data: newRef } = await supabase
          .from("referrals")
          .insert({ referrer_id: user.id })
          .select()
          .single();
        if (newRef) {
          setReferralCode(newRef.referral_code);
          setReferrals([newRef]);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const referralLink = `${window.location.origin}/auth?mode=signup&ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Referral link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join PG Manager",
        text: "Manage your PG business like a pro! Use my referral link to sign up.",
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  const successfulReferrals = referrals.filter(r => r.status === "completed").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Refer & Earn
          </h1>
          <p className="text-muted-foreground">Invite other PG owners and earn rewards</p>
        </div>

        {/* How it works */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Share your link", desc: "Send your unique referral link to other PG owners" },
                { step: "2", title: "They sign up", desc: "When they create an account using your link" },
                { step: "3", title: "Both earn rewards", desc: "You get 1 month free Pro, they get extended trial" },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Referral Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-sm" />
              <Button onClick={handleCopy} variant="outline" className="shrink-0 gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button onClick={handleShare} className="shrink-0 gap-2 gradient-primary">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link via WhatsApp, email, or any social media
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{referrals.length}</p>
              <p className="text-sm text-muted-foreground">Total Invites</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Check className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{successfulReferrals}</p>
              <p className="text-sm text-muted-foreground">Successful Referrals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Gift className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{successfulReferrals}</p>
              <p className="text-sm text-muted-foreground">Free Months Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral History */}
        {referrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Referral History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{r.referred_email || "Invitation pending"}</p>
                      <p className="text-xs text-muted-foreground">Code: {r.referral_code}</p>
                    </div>
                    <Badge variant={r.status === "completed" ? "default" : "secondary"}
                      className={r.status === "completed" ? "bg-success" : ""}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Referrals;

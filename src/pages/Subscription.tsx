import { useEffect, useState } from "react";
import { Check, Crown, Zap, Building2, IndianRupee, Loader2, Camera, Video, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { useNavigate } from "react-router-dom";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  tenant_limit: number;
  features: string[];
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  razorpay_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLAN_ICONS: Record<string, typeof Crown> = {
  free: Building2,
  pro: Zap,
  business: Crown,
  enterprise: Star,
};

const Subscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isStaff, loading: staffLoading } = useStaffAccess();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [tenantCount, setTenantCount] = useState(0);

  // Redirect staff to dashboard
  useEffect(() => {
    if (!staffLoading && isStaff) {
      navigate("/dashboard", { replace: true });
    }
  }, [isStaff, staffLoading, navigate]);

  useEffect(() => {
    if (!user || isStaff) return;
    const fetchData = async () => {
      const [plansRes, subRes, tenantRes] = await Promise.all([
        supabase.from("subscription_plans").select("*").eq("is_active", true).order("monthly_price"),
        supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle(),
        supabase.from("tenant_assignments").select("id, property_id, properties!inner(owner_id)")
          .eq("properties.owner_id", user.id).eq("is_active", true),
      ]);

      const parsedPlans = (plansRes.data ?? []).map(p => ({
        ...p,
        features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features ?? []),
      }));
      setPlans(parsedPlans);
      setCurrentSub(subRes.data);
      setTenantCount(tenantRes.data?.length ?? 0);
      setLoading(false);
    };
    fetchData();

    // Load Razorpay script
    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
    }
  }, [user, isStaff]);

  // Don't render anything for staff
  if (staffLoading || isStaff) return null;

  const getCurrentPlan = () => {
    if (!currentSub) return plans.find(p => p.slug === "free");
    return plans.find(p => p.id === currentSub.plan_id);
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!user) return;
    setSubscribing(plan.slug);

    try {
      const billingCycle = yearly ? "yearly" : "monthly";

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { plan_slug: plan.slug, billing_cycle: billingCycle },
      });

      if (error) throw new Error(error.message);

      if (data.free) {
        toast({ title: "You're on the Free plan!" });
        setSubscribing(null);
        // Refresh
        const { data: subData } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle();
        setCurrentSub(subData);
        return;
      }

      // Open Razorpay Checkout
      const options = {
        key: data.razorpay_key,
        subscription_id: data.subscription_id,
        name: "PGManager",
        description: `${data.plan_name} Plan (${data.billing_cycle})`,
        handler: async function (response: any) {
          toast({ title: "Payment successful!", description: "Activating your subscription..." });
          try {
            // Verify and activate subscription server-side
            await supabase.functions.invoke("verify-subscription-payment", {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            toast({ title: "Subscription activated!", description: "You now have access to Pro features." });
          } catch (e) {
            console.error("Verify failed, will retry via webhook", e);
          }
          // Refresh subscription
          const { data: subData } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle();
          setCurrentSub(subData);
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: () => {
            setSubscribing(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSubscribing(null);
  };

  const currentPlan = getCurrentPlan();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground mt-1">Choose the right plan for your PG business</p>
        </div>

        {/* Current plan info */}
        {currentPlan && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-lg font-bold">{currentPlan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {tenantCount} / {currentPlan.tenant_limit === -1 ? "∞" : currentPlan.tenant_limit} tenants used
                  </p>
                </div>
                {currentSub?.current_period_end && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Renews on</p>
                    <p className="font-medium">{new Date(currentSub.current_period_end).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3">
          <Label className={!yearly ? "font-semibold" : "text-muted-foreground"}>Monthly</Label>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <Label className={yearly ? "font-semibold" : "text-muted-foreground"}>
            Yearly <Badge variant="secondary" className="ml-1 text-xs bg-success/10 text-success">Save ~17%</Badge>
          </Label>
        </div>

        {/* Plan cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const Icon = PLAN_ICONS[plan.slug] || Building2;
              const price = yearly ? plan.yearly_price : plan.monthly_price;
              const isCurrentPlan = currentPlan?.id === plan.id;
              const isPopular = plan.slug === "pro";

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${isPopular ? "border-primary shadow-lg scale-[1.02]" : ""} ${isCurrentPlan ? "border-success/50 bg-success/5" : ""}`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary">Most Popular</Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="text-center mb-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <IndianRupee className="w-5 h-5" />
                        <span className="text-4xl font-bold">{price.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {price === 0 ? "Free forever" : yearly ? "/year" : "/month"}
                      </p>
                    </div>

                    <Separator className="mb-4" />

                    <div className="space-y-2.5 flex-1">
                      <p className="text-sm font-semibold">
                        {plan.tenant_limit === -1 ? "Unlimited" : `Up to ${plan.tenant_limit}`} tenants
                      </p>



                      {(plan.features as string[]).filter(f =>
                        !f.toLowerCase().includes("photo") &&
                        !f.toLowerCase().includes("video") &&
                        !f.toLowerCase().includes("featured") &&
                        !f.toLowerCase().includes("enquiry")
                      ).map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full mt-6 ${isPopular ? "gradient-primary" : ""}`}
                      variant={isPopular ? "default" : "outline"}
                      disabled={isCurrentPlan || subscribing === plan.slug}
                      onClick={() => handleSubscribe(plan)}
                    >
                      {subscribing === plan.slug ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : isCurrentPlan ? (
                        "Current Plan"
                      ) : price === 0 ? (
                        "Get Started"
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Subscription;

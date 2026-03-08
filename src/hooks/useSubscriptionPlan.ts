import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PlanSlug = "free" | "pro" | "business";

export interface PlanLimits {
  slug: PlanSlug;
  name: string;
  maxPhotos: number;
  videoTour: boolean;
  enquiryAnalytics: boolean;
  featuredBadge: boolean;
}

const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  free: {
    slug: "free",
    name: "Free",
    maxPhotos: 3,
    videoTour: false,
    enquiryAnalytics: false,
    featuredBadge: false,
  },
  pro: {
    slug: "pro",
    name: "Pro",
    maxPhotos: 10,
    videoTour: true,
    enquiryAnalytics: false,
    featuredBadge: false,
  },
  business: {
    slug: "business",
    name: "Business",
    maxPhotos: Infinity,
    videoTour: true,
    enquiryAnalytics: true,
    featuredBadge: true,
  },
};

export const useSubscriptionPlan = () => {
  const { user } = useAuth();
  const [planSlug, setPlanSlug] = useState<PlanSlug>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("subscription_plans(slug)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      const slug = (data as any)?.subscription_plans?.slug as PlanSlug;
      setPlanSlug(slug || "free");
      setLoading(false);
    };

    fetchPlan();
  }, [user]);

  return {
    planSlug,
    limits: PLAN_LIMITS[planSlug],
    loading,
    isPro: planSlug === "pro" || planSlug === "business",
    isBusiness: planSlug === "business",
  };
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PlanSlug = "free" | "pro" | "business" | "enterprise";

export interface PlanLimits {
  slug: PlanSlug;
  name: string;
  maxPhotos: number;
  videoTour: boolean;
  enquiryAnalytics: boolean;
  featuredBadge: boolean;
  tenantLimit: number;
}

const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  free: {
    slug: "free",
    name: "Free",
    maxPhotos: 3,
    videoTour: false,
    enquiryAnalytics: false,
    featuredBadge: false,
    tenantLimit: 5,
  },
  pro: {
    slug: "pro",
    name: "Pro",
    maxPhotos: 10,
    videoTour: true,
    enquiryAnalytics: false,
    featuredBadge: false,
    tenantLimit: 25,
  },
  business: {
    slug: "business",
    name: "Business",
    maxPhotos: Infinity,
    videoTour: true,
    enquiryAnalytics: true,
    featuredBadge: true,
    tenantLimit: 100,
  },
  enterprise: {
    slug: "enterprise",
    name: "Enterprise",
    maxPhotos: Infinity,
    videoTour: true,
    enquiryAnalytics: true,
    featuredBadge: true,
    tenantLimit: Infinity,
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
        .select("subscription_plans(slug), status, current_period_end")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (data) {
        const periodEnd = data.current_period_end;
        // If period has expired, treat as free regardless of status
        if (periodEnd && new Date(periodEnd) < new Date()) {
          setPlanSlug("free");
        } else {
          const slug = (data as any)?.subscription_plans?.slug as PlanSlug;
          setPlanSlug(slug || "free");
        }
      } else {
        setPlanSlug("free");
      }
      setLoading(false);
    };

    fetchPlan();
  }, [user]);

  return {
    planSlug,
    limits: PLAN_LIMITS[planSlug],
    loading,
    isPro: planSlug === "pro" || planSlug === "business" || planSlug === "enterprise",
    isBusiness: planSlug === "business" || planSlug === "enterprise",
    isEnterprise: planSlug === "enterprise",
  };
};

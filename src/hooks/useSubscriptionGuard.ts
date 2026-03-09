import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionPlan } from "@/hooks/useSubscriptionPlan";

export const useSubscriptionGuard = () => {
  const { user } = useAuth();
  const { planSlug, limits, loading: planLoading } = useSubscriptionPlan();
  const [tenantCount, setTenantCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || planLoading) return;

    const fetchTenantCount = async () => {
      const { count } = await supabase
        .from("tenant_assignments")
        .select("id, property_id, properties!inner(owner_id)", { count: "exact", head: true })
        .eq("properties.owner_id", user.id)
        .eq("is_active", true);

      setTenantCount(count ?? 0);
      setLoading(false);
    };

    fetchTenantCount();
  }, [user, planLoading]);

  const isOverLimit = limits.tenantLimit !== Infinity && tenantCount > limits.tenantLimit;
  const isReadOnly = isOverLimit;
  const excessTenants = isOverLimit ? tenantCount - limits.tenantLimit : 0;

  return {
    planSlug,
    limits,
    tenantCount,
    isOverLimit,
    isReadOnly,
    excessTenants,
    loading: loading || planLoading,
  };
};

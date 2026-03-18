import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { useSubscriptionPlan } from "@/hooks/useSubscriptionPlan";

export const useSubscriptionGuard = () => {
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const { planSlug, limits, loading: planLoading } = useSubscriptionPlan(effectiveOwnerId);
  const [tenantCount, setTenantCount] = useState(0);
  const [bedCount, setBedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!effectiveOwnerId || planLoading || staffLoading) return;

    const fetchCounts = async () => {
      // Count active tenants for this owner
      const { count: tCount } = await supabase
        .from("tenant_assignments")
        .select("id, property_id, properties!inner(owner_id)", { count: "exact", head: true })
        .eq("properties.owner_id", effectiveOwnerId)
        .eq("is_active", true);

      // Count total beds (capacity) across all owner's rooms
      const { data: rooms } = await supabase
        .from("rooms")
        .select("capacity, property_id, properties!inner(owner_id)")
        .eq("properties.owner_id", effectiveOwnerId);

      const totalBeds = (rooms ?? []).reduce((sum, r) => sum + (r.capacity || 0), 0);

      setTenantCount(tCount ?? 0);
      setBedCount(totalBeds);
      setLoading(false);
    };

    fetchCounts();
  }, [effectiveOwnerId, planLoading, staffLoading]);

  const isOverLimit = limits.tenantLimit !== Infinity && tenantCount > limits.tenantLimit;
  const isReadOnly = isOverLimit;
  const excessTenants = isOverLimit ? tenantCount - limits.tenantLimit : 0;
  const isBedLimitReached = limits.tenantLimit !== Infinity && bedCount >= limits.tenantLimit;

  return {
    planSlug,
    limits,
    tenantCount,
    bedCount,
    isOverLimit,
    isReadOnly,
    isBedLimitReached,
    excessTenants,
    loading: loading || planLoading || staffLoading,
  };
};

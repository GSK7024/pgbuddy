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
      // First get all property IDs for this owner
      const { data: ownerProps } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", effectiveOwnerId);

      const propIds = (ownerProps ?? []).map(p => p.id);

      if (propIds.length === 0) {
        setTenantCount(0);
        setBedCount(0);
        setLoading(false);
        return;
      }

      // Count active tenants across those properties
      const { count: tCount } = await supabase
        .from("tenant_assignments")
        .select("id", { count: "exact", head: true })
        .in("property_id", propIds)
        .eq("is_active", true);

      // Count total beds (capacity) across all rooms in those properties
      const { data: rooms } = await supabase
        .from("rooms")
        .select("capacity")
        .in("property_id", propIds);

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

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { useSubscriptionPlan } from "@/hooks/useSubscriptionPlan";

export const useSubscriptionGuard = () => {
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const { planSlug, limits, loading: planLoading } = useSubscriptionPlan(effectiveOwnerId);
  const [bedCount, setBedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Call this after adding/removing beds to force a recount
  const refetchBedCount = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (!effectiveOwnerId || planLoading || staffLoading) return;

    const fetchBedCount = async () => {
      // Get all property IDs for the owner
      const { data: ownerProps } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", effectiveOwnerId);

      const propIds = (ownerProps ?? []).map(p => p.id);

      if (propIds.length === 0) {
        setBedCount(0);
        setLoading(false);
        return;
      }

      // Count total beds (room capacity) across all owner's properties
      const { data: rooms } = await supabase
        .from("rooms")
        .select("capacity")
        .in("property_id", propIds);

      const totalBeds = (rooms ?? []).reduce((sum, r) => sum + (r.capacity || 0), 0);
      setBedCount(totalBeds);
      setLoading(false);
    };

    fetchBedCount();
  }, [effectiveOwnerId, planLoading, staffLoading, refreshKey]);

  const bedLimit = limits.tenantLimit;
  const isOverLimit = bedLimit !== Infinity && bedCount > bedLimit;
  const isReadOnly = isOverLimit;
  const isBedLimitReached = bedLimit !== Infinity && bedCount >= bedLimit;

  return {
    planSlug,
    limits,
    bedCount,
    bedLimit,
    isOverLimit,
    isReadOnly,
    isBedLimitReached,
    refetchBedCount,
    loading: loading || planLoading || staffLoading,
  };
};

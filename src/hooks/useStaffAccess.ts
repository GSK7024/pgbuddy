import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StaffAccess {
  /** Whether the current user is a staff member (not the property owner) */
  isStaff: boolean;
  /** The owner ID whose properties this staff can access (or the user's own ID if they're the owner) */
  effectiveOwnerId: string | null;
  /** The staff role (manager, accountant, caretaker) — null if user is the actual owner */
  staffRole: string | null;
  /** Property IDs this user can access (own properties + staff-assigned properties) */
  accessiblePropertyIds: string[];
  /** True while loading staff access info */
  loading: boolean;
}

/**
 * Hook that provides unified property access for both owners and staff members.
 * - For owners: returns their own user ID and their own property IDs.
 * - For staff: returns the owner's ID and the staff-assigned property IDs.
 * 
 * Use `effectiveOwnerId` when querying `properties.owner_id`.
 * Use `accessiblePropertyIds` when filtering by property_id.
 */
export const useStaffAccess = (): StaffAccess => {
  const { user } = useAuth();
  const [isStaff, setIsStaff] = useState(false);
  const [effectiveOwnerId, setEffectiveOwnerId] = useState<string | null>(null);
  const [staffRole, setStaffRole] = useState<string | null>(null);
  const [accessiblePropertyIds, setAccessiblePropertyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAccess = async () => {
      // Check if user is staff
      const { data: staffData } = await supabase
        .from("staff_members")
        .select("owner_id, role, property_id")
        .eq("staff_user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (staffData) {
        // User is staff
        setIsStaff(true);
        setEffectiveOwnerId(staffData.owner_id);
        setStaffRole(staffData.role);

        // Get accessible property IDs via the RPC
        const { data: propIds } = await supabase.rpc("get_staff_property_ids", {
          _user_id: user.id,
        });
        setAccessiblePropertyIds(propIds ?? []);
      } else {
        // User is the owner
        setIsStaff(false);
        setEffectiveOwnerId(user.id);
        setStaffRole(null);

        // Get owner's own property IDs
        const { data: ownProps } = await supabase
          .from("properties")
          .select("id")
          .eq("owner_id", user.id);
        setAccessiblePropertyIds((ownProps ?? []).map((p) => p.id));
      }

      setLoading(false);
    };

    fetchAccess();
  }, [user]);

  return { isStaff, effectiveOwnerId, staffRole, accessiblePropertyIds, loading };
};

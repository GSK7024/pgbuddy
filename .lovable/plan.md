

## Problem Analysis

Two issues identified:

1. **Room vacancy bug**: When assigning a tenant to a room (line 121 in `Tenants.tsx`), the code immediately sets `is_vacant = false` on the room regardless of its capacity. A 3-bed room becomes "occupied" after just 1 tenant is assigned.

2. **No per-tenant rent customization**: All tenants in a room pay the same `rent_amount` from the `rooms` table. Owner needs ability to set different rent per bed/tenant (e.g., one bed costs more due to window/AC).

## Plan

### 1. Fix room vacancy logic

- Change `handleAssign` to count active assignments for the room after inserting. Only set `is_vacant = false` when active assignments >= room capacity.
- Change `handleDeactivate` (move-out) to always set `is_vacant = true` since a bed freed up.
- Update the room dropdown in the assign dialog to show rooms that have available beds (active assignments < capacity) instead of only `is_vacant === true` rooms.
- Fetch room capacity alongside other room data so we can compare.

### 2. Add per-tenant rent amount

- Add a `custom_rent` column (numeric, nullable) to `tenant_assignments` table via migration. When set, this overrides the room's default rent.
- In the assign tenant dialog, pre-fill rent from room's `rent_amount` but allow owner to override.
- In the tenant detail dialog, show and allow editing of the tenant's rent amount.
- Show the tenant's rent on their card.

### 3. Update room display

- Update `Rooms.tsx` vacancy badge to show occupancy count (e.g., "2/3 occupied") instead of just Vacant/Occupied.
- The badge/status should reflect actual assignment count vs capacity.

### Database Migration

```sql
ALTER TABLE tenant_assignments ADD COLUMN custom_rent numeric;
```

### Files to modify
- **Migration**: Add `custom_rent` column to `tenant_assignments`
- **`src/pages/Tenants.tsx`**: Fix vacancy logic, add rent field in assign/detail forms, fetch capacity data, show available beds instead of vacant rooms
- **`src/pages/Rooms.tsx`**: Show occupancy count based on active assignments


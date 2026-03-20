-- Clear all user data to start fresh
-- Keeps subscription_plans definitions intact

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'notifications', 'complaints', 'vacancy_notices', 'announcements',
    'rent_payments', 'tenant_assignments', 'expense_items', 'expenses',
    'mess_attendance', 'mess_guests', 'mess_plans', 'visitor_log',
    'utility_bills', 'beds', 'rooms', 'staff_members', 'properties',
    'subscriptions', 'profiles'
  ];
BEGIN
  SET session_replication_role = 'replica';
  FOREACH tbl IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('TRUNCATE TABLE %I CASCADE', tbl);
      RAISE NOTICE 'Truncated: %', tbl;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Skipped (not found): %', tbl;
    END;
  END LOOP;
  SET session_replication_role = 'origin';
END $$;

-- Delete all auth users
DELETE FROM auth.users;

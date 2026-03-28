-- Clean ALL data except owner 7743843389
-- Keep: his profile, properties, rooms, beds, subscription
-- Delete: his tenants/assignments/payments + ALL other users

CREATE TEMP TABLE _owner_props AS
SELECT id FROM public.properties
WHERE owner_id = (
  SELECT user_id FROM public.profiles
  WHERE RIGHT(REPLACE(REPLACE(phone, '+', ''), ' ', ''), 10) = '7743843389'
  LIMIT 1
);

CREATE TEMP TABLE _owner_uid AS
SELECT user_id FROM public.profiles
WHERE RIGHT(REPLACE(REPLACE(phone, '+', ''), ' ', ''), 10) = '7743843389'
LIMIT 1;

-- Clear owner's tenant data
DELETE FROM public.rent_payments WHERE property_id IN (SELECT id FROM _owner_props);
DELETE FROM public.utility_bills WHERE property_id IN (SELECT id FROM _owner_props);
DELETE FROM public.tenant_assignments WHERE property_id IN (SELECT id FROM _owner_props);
DELETE FROM public.complaints WHERE property_id IN (SELECT id FROM _owner_props);
DELETE FROM public.visitor_logs WHERE property_id IN (SELECT id FROM _owner_props);
DELETE FROM public.announcements WHERE property_id IN (SELECT id FROM _owner_props);
DELETE FROM public.audit_logs WHERE property_id IN (SELECT id FROM _owner_props);
DELETE FROM public.expenses WHERE property_id IN (SELECT id FROM _owner_props);
DELETE FROM public.community_messages WHERE property_id IN (SELECT id FROM _owner_props);
DELETE FROM public.vacancy_notices WHERE property_id IN (SELECT id FROM _owner_props);

-- Reset beds & rooms to vacant  
UPDATE public.beds SET is_vacant = true
WHERE room_id IN (SELECT id FROM public.rooms WHERE property_id IN (SELECT id FROM _owner_props));
UPDATE public.rooms SET is_vacant = true WHERE property_id IN (SELECT id FROM _owner_props);

-- Delete other owners' property-based data
DELETE FROM public.rent_payments WHERE property_id NOT IN (SELECT id FROM _owner_props);
DELETE FROM public.utility_bills WHERE property_id NOT IN (SELECT id FROM _owner_props);
DELETE FROM public.tenant_assignments WHERE property_id NOT IN (SELECT id FROM _owner_props);
DELETE FROM public.complaints WHERE property_id NOT IN (SELECT id FROM _owner_props);
DELETE FROM public.visitor_logs WHERE property_id NOT IN (SELECT id FROM _owner_props);
DELETE FROM public.announcements WHERE property_id NOT IN (SELECT id FROM _owner_props);
DELETE FROM public.audit_logs WHERE property_id NOT IN (SELECT id FROM _owner_props);
DELETE FROM public.expenses WHERE property_id NOT IN (SELECT id FROM _owner_props);
DELETE FROM public.community_messages WHERE property_id NOT IN (SELECT id FROM _owner_props);
DELETE FROM public.vacancy_notices WHERE property_id NOT IN (SELECT id FROM _owner_props);

-- Mess data cleanup (actual columns: mess_members.plan_id, attendance/off_days/payments.member_id, one_time_meals/expenses.owner_id)
DELETE FROM public.mess_attendance WHERE member_id IN (SELECT id FROM public.mess_members WHERE owner_id NOT IN (SELECT user_id FROM _owner_uid));
DELETE FROM public.mess_off_days WHERE member_id IN (SELECT id FROM public.mess_members WHERE owner_id NOT IN (SELECT user_id FROM _owner_uid));
DELETE FROM public.mess_payments WHERE member_id IN (SELECT id FROM public.mess_members WHERE owner_id NOT IN (SELECT user_id FROM _owner_uid));
DELETE FROM public.mess_one_time_meals WHERE owner_id NOT IN (SELECT user_id FROM _owner_uid);
DELETE FROM public.mess_expenses WHERE owner_id NOT IN (SELECT user_id FROM _owner_uid);
DELETE FROM public.mess_members WHERE owner_id NOT IN (SELECT user_id FROM _owner_uid);
DELETE FROM public.mess_plans WHERE owner_id NOT IN (SELECT user_id FROM _owner_uid);

-- Beds → rooms → properties for other owners
DELETE FROM public.beds WHERE room_id IN (SELECT id FROM public.rooms WHERE property_id NOT IN (SELECT id FROM _owner_props));
DELETE FROM public.rooms WHERE property_id NOT IN (SELECT id FROM _owner_props);
DELETE FROM public.properties WHERE id NOT IN (SELECT id FROM _owner_props);

-- Other user-level data
DELETE FROM public.staff_members WHERE owner_id NOT IN (SELECT user_id FROM _owner_uid);
DELETE FROM public.subscriptions WHERE user_id NOT IN (SELECT user_id FROM _owner_uid);
DELETE FROM public.referrals WHERE referrer_id NOT IN (SELECT user_id FROM _owner_uid);
DELETE FROM public.push_subscriptions WHERE user_id NOT IN (SELECT user_id FROM _owner_uid);
DELETE FROM public.profiles WHERE user_id NOT IN (SELECT user_id FROM _owner_uid);
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT user_id FROM _owner_uid);

DROP TABLE _owner_props;
DROP TABLE _owner_uid;

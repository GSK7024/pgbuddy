
-- Property photos table
CREATE TABLE public.property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text NOT NULL,
  caption text,
  is_cover boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view property photos"
ON public.property_photos FOR SELECT USING (true);

CREATE POLICY "Owners can manage their property photos"
ON public.property_photos FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = property_photos.property_id AND properties.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = property_photos.property_id AND properties.owner_id = auth.uid()));

-- Property reviews table
CREATE TABLE public.property_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(property_id, tenant_id)
);

ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
ON public.property_reviews FOR SELECT USING (true);

CREATE POLICY "Verified tenants can manage their reviews"
ON public.property_reviews FOR ALL TO authenticated
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id AND EXISTS (
  SELECT 1 FROM tenant_assignments
  WHERE tenant_assignments.tenant_id = auth.uid()
  AND tenant_assignments.property_id = property_reviews.property_id
));

-- Property enquiries table
CREATE TABLE public.property_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  visitor_name text NOT NULL,
  visitor_phone text NOT NULL,
  visitor_email text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.property_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit enquiries"
ON public.property_enquiries FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can view their property enquiries"
ON public.property_enquiries FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = property_enquiries.property_id AND properties.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = property_enquiries.property_id AND properties.owner_id = auth.uid()));

-- Add video_url column to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS video_url text;

-- Storage bucket for property photos
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true);

-- Storage policies for property-photos
CREATE POLICY "Anyone can view property photos storage"
ON storage.objects FOR SELECT USING (bucket_id = 'property-photos');

CREATE POLICY "Authenticated users can upload property photos"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-photos');

CREATE POLICY "Authenticated users can delete property photos"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-photos');

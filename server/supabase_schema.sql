-- ====================================================================
-- PRAVASA AI - SUPABASE MASTER DATABASE SCHEMA
-- Version: v0.2.0 - Central Karnataka Tourism Intelligence Platform
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- TABLE 1: PROFILES (Extends Supabase auth.users)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'gov_admin', 'admin')),
    city TEXT DEFAULT 'Bengaluru',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- ====================================================================
-- TABLE 2: ADMIN_USERS (Protected Government Tourism Officials)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    gov_designation TEXT NOT NULL,
    department TEXT DEFAULT 'Department of Tourism, Government of Karnataka',
    badge_number TEXT,
    is_verified_admin BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- TABLE 3: DESTINATIONS (Master Karnataka Destinations Table)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.destinations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_kannada TEXT,
    district TEXT NOT NULL,
    taluk TEXT,
    division TEXT,
    place_type TEXT DEFAULT 'attraction',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    description TEXT,
    short_description TEXT,
    image TEXT,
    image_attribution JSONB DEFAULT '{}'::jsonb,
    time_of_day_media JSONB DEFAULT '{}'::jsonb,
    video JSONB DEFAULT '{}'::jsonb,
    entry_fee_inr INTEGER DEFAULT 0,
    opening_hours TEXT DEFAULT '06:00 - 18:00',
    contact TEXT DEFAULT '1800-425-4425',
    official_website TEXT DEFAULT 'https://karnatakatourism.org',
    accessibility TEXT DEFAULT 'Partially accessible',
    accessibility_score INTEGER DEFAULT 6,
    parking BOOLEAN DEFAULT TRUE,
    offbeat BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    verification_status TEXT DEFAULT 'verified',
    verified_date DATE DEFAULT CURRENT_DATE,
    source TEXT DEFAULT 'Department of Tourism, Government of Karnataka',
    source_url TEXT DEFAULT 'https://karnatakatourism.org',
    crowd_level INTEGER DEFAULT 2 CHECK (crowd_level BETWEEN 1 AND 5),
    senior_friendly BOOLEAN DEFAULT TRUE,
    family_friendly BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_by TEXT DEFAULT 'Gov Tourism Admin'
);

CREATE INDEX IF NOT EXISTS idx_destinations_district ON public.destinations(district);
CREATE INDEX IF NOT EXISTS idx_destinations_is_published ON public.destinations(is_published);
CREATE INDEX IF NOT EXISTS idx_destinations_offbeat ON public.destinations(offbeat);
CREATE INDEX IF NOT EXISTS idx_destinations_coords ON public.destinations(lat, lng);

-- ====================================================================
-- TABLE 4: DESTINATION_IMAGES (Gallery & Daytime Photos)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.destination_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    time_period TEXT DEFAULT 'general' CHECK (time_period IN ('morning', 'afternoon', 'evening', 'night', 'general')),
    caption TEXT,
    attribution TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dest_images_dest_id ON public.destination_images(destination_id);

-- ====================================================================
-- TABLE 5: DESTINATION_CATEGORIES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.destination_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dest_categories_cat ON public.destination_categories(category);

-- ====================================================================
-- TABLE 6: DESTINATION_TIMINGS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.destination_timings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE CASCADE,
    day_of_week TEXT DEFAULT 'All',
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    special_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dest_timings_dest_id ON public.destination_timings(destination_id);

-- ====================================================================
-- TABLE 7: DESTINATION_SERVICES (Tourist Amenities)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.destination_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dest_services_dest_id ON public.destination_services(destination_id);

-- ====================================================================
-- TABLE 8: HIDDEN_GEMS (Curated Offbeat Intelligence)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.hidden_gems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id TEXT UNIQUE REFERENCES public.destinations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'hidden_gem' CHECK (status IN ('hidden_gem', 'lesser_known', 'emerging')),
    why_offbeat TEXT,
    nearest_major_hub TEXT,
    route_condition TEXT,
    best_time_to_visit TEXT,
    cultural_significance TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hidden_gems_dest_id ON public.hidden_gems(destination_id);

-- ====================================================================
-- TABLE 9: DESTINATION_REVIEWS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.destination_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_avatar TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT NOT NULL,
    visit_date DATE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dest_reviews_dest_id ON public.destination_reviews(destination_id);

-- ====================================================================
-- TABLE 10: DESTINATION_FEEDBACK
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.destination_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    feedback_type TEXT DEFAULT 'general' CHECK (feedback_type IN ('facility_issue', 'timing_correction', 'photo_update', 'general')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dest_feedback_status ON public.destination_feedback(status);

-- ====================================================================
-- TABLE 11: TOURIST_BOOKMARKS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.tourist_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, destination_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.tourist_bookmarks(user_id);

-- ====================================================================
-- TABLE 12: USER_ACTIVITY
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity(user_id);

-- ====================================================================
-- TABLE 13: CROWD_REPORTS (Live Visitor Crowd Updates)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.crowd_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id TEXT REFERENCES public.destinations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    crowd_level INTEGER CHECK (crowd_level BETWEEN 1 AND 5),
    queue_time_minutes INTEGER DEFAULT 0,
    parking_status TEXT DEFAULT 'available' CHECK (parking_status IN ('available', 'limited', 'full')),
    reported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crowd_reports_dest ON public.crowd_reports(destination_id);

-- ====================================================================
-- TABLE 14: NOTIFICATIONS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- ====================================================================
-- AUTOMATIC TIMESTAMP TRIGGER
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_destinations_updated_at ON public.destinations;
CREATE TRIGGER set_destinations_updated_at
BEFORE UPDATE ON public.destinations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- AUTH USER TO PROFILE TRIGGER
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        is_email_verified,
        is_phone_verified,
        role,
        avatar_url,
        last_sign_in_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.phone,
        NEW.email_confirmed_at IS NOT NULL,
        NEW.phone_confirmed_at IS NOT NULL,
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        is_email_verified = (NEW.email_confirmed_at IS NOT NULL),
        is_phone_verified = (NEW.phone_confirmed_at IS NOT NULL),
        last_sign_in_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_timings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_gems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourist_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: Is user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('gov_admin', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Destinations Policies:
-- Public can read all published destinations
CREATE POLICY "Public read published destinations"
ON public.destinations FOR SELECT
USING (is_published = TRUE OR public.is_admin());

-- Only admins can insert, update, or delete destinations
CREATE POLICY "Admins full access to destinations"
ON public.destinations FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Destination Sub-tables Read Policies (Public Read)
CREATE POLICY "Public read images" ON public.destination_images FOR SELECT USING (TRUE);
CREATE POLICY "Public read categories" ON public.destination_categories FOR SELECT USING (TRUE);
CREATE POLICY "Public read timings" ON public.destination_timings FOR SELECT USING (TRUE);
CREATE POLICY "Public read services" ON public.destination_services FOR SELECT USING (TRUE);
CREATE POLICY "Public read hidden gems" ON public.hidden_gems FOR SELECT USING (TRUE);
CREATE POLICY "Public read reviews" ON public.destination_reviews FOR SELECT USING (is_approved = TRUE OR public.is_admin());
CREATE POLICY "Public read crowd reports" ON public.crowd_reports FOR SELECT USING (TRUE);

-- Destination Sub-tables Write Policies (Admin Only)
CREATE POLICY "Admin write images" ON public.destination_images FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write categories" ON public.destination_categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write timings" ON public.destination_timings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write services" ON public.destination_services FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write hidden gems" ON public.hidden_gems FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- User reviews policy
CREATE POLICY "Auth users insert reviews" ON public.destination_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.destination_reviews FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users delete own reviews" ON public.destination_reviews FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Bookmarks policy
CREATE POLICY "Users own bookmarks select" ON public.tourist_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own bookmarks insert" ON public.tourist_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own bookmarks delete" ON public.tourist_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Profiles policy
CREATE POLICY "Public can view profile summary" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.destinations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.destination_images;
ALTER PUBLICATION supabase_realtime ADD TABLE public.destination_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crowd_reports;

-- ====================================================================
-- STORAGE BUCKETS SETUP (Run via SQL or Supabase Dashboard)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('destination-images', 'destination-images', TRUE),
  ('destination-gallery', 'destination-gallery', TRUE),
  ('tourism-backgrounds', 'tourism-backgrounds', TRUE),
  ('user-uploads', 'user-uploads', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Public read access for storage buckets
CREATE POLICY "Public read storage" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('destination-images', 'destination-gallery', 'tourism-backgrounds', 'user-uploads'));

-- Admin upload access for destination buckets
CREATE POLICY "Admin upload destination storage" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id IN ('destination-images', 'destination-gallery', 'tourism-backgrounds')
    AND (public.is_admin() OR auth.role() = 'service_role')
);

-- User upload access for user-uploads bucket
CREATE POLICY "Auth users upload to user-uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'user-uploads'
    AND auth.uid() IS NOT NULL
);


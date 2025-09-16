-- Create user role enum
CREATE TYPE user_role AS ENUM ('user', 'pro', 'admin');

-- Create KYC status enum  
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');

-- Create verification status enum
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Create pricing type enum
CREATE TYPE pricing_type AS ENUM ('fixed', 'hourly');

-- Create slot status enum
CREATE TYPE slot_status AS ENUM ('open', 'blocked', 'booked');

-- Create slot source enum
CREATE TYPE slot_source AS ENUM ('manual', 'booking', 'admin');

-- Create booking status enum
CREATE TYPE booking_status AS ENUM ('pending', 'awaiting_payment', 'confirmed', 'in_progress', 'completed', 'canceled', 'disputed');

-- Create booking event type enum
CREATE TYPE booking_event_type AS ENUM ('created', 'paid', 'confirmed', 'rescheduled', 'canceled', 'completed', 'disputed', 'escrow_released', 'refunded');

-- Create escrow status enum
CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded');

-- Create dispute status enum
CREATE TYPE dispute_status AS ENUM ('open', 'investigating', 'resolved', 'refunded', 'dismissed');

-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL DEFAULT 'user',
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  photo_url TEXT,
  kyc_status kyc_status NOT NULL DEFAULT 'pending',
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create addresses table
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT,
  line1 TEXT,
  city TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geom TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create pro_profiles table
CREATE TABLE public.pro_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  company_name TEXT,
  service_radius_km INTEGER DEFAULT 10,
  base_city TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geom TEXT,
  avg_price_hint INTEGER,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  insurance_provider TEXT,
  languages TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create service_categories table
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create pro_services table
CREATE TABLE public.pro_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.pro_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  pricing_type pricing_type NOT NULL,
  price NUMERIC(10,2),
  min_hours NUMERIC(4,2),
  description TEXT,
  photos TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create availability_slots table
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.pro_profiles(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  rrule_text TEXT,
  capacity INTEGER DEFAULT 1,
  status slot_status NOT NULL DEFAULT 'open',
  source slot_source NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.pro_profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.pro_services(id),
  category_id UUID REFERENCES public.service_categories(id),
  address_id UUID REFERENCES public.addresses(id),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geom TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  price_quote NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create booking_events table
CREATE TABLE public.booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  type booking_event_type NOT NULL,
  meta JSONB,
  at TIMESTAMPTZ DEFAULT now()
);

-- Create payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.pro_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2),
  provider_payout_id TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.pro_profiles(id) ON DELETE CASCADE,
  provider TEXT,
  provider_payment_id TEXT,
  amount NUMERIC(10,2),
  fee_app NUMERIC(10,2),
  fee_psp NUMERIC(10,2),
  escrow_status escrow_status NOT NULL DEFAULT 'held',
  payout_id UUID REFERENCES public.payouts(id),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat_threads table
CREATE TABLE public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  opener_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT,
  details TEXT,
  status dispute_status NOT NULL DEFAULT 'open',
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable" ON public.users FOR SELECT USING (true);

-- Create RLS policies for addresses table
CREATE POLICY "Users can manage their own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for pro_profiles table
CREATE POLICY "Pro profiles are publicly viewable" ON public.pro_profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage their own pro profile" ON public.pro_profiles FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for service_categories table
CREATE POLICY "Service categories are publicly viewable" ON public.service_categories FOR SELECT USING (true);

-- Create RLS policies for pro_services table
CREATE POLICY "Pro services are publicly viewable" ON public.pro_services FOR SELECT USING (true);
CREATE POLICY "Pros can manage their own services" ON public.pro_services FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.pro_profiles WHERE id = pro_id)
);

-- Create RLS policies for availability_slots table
CREATE POLICY "Availability slots are publicly viewable" ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY "Pros can manage their own availability" ON public.availability_slots FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.pro_profiles WHERE id = pro_id)
);

-- Create RLS policies for bookings table
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.pro_profiles WHERE id = pro_id)
);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and pros can update relevant bookings" ON public.bookings FOR UPDATE USING (
  auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.pro_profiles WHERE id = pro_id)
);

-- Create RLS policies for booking_events table
CREATE POLICY "Booking events visible to booking participants" ON public.booking_events FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.bookings WHERE id = booking_id
    UNION
    SELECT user_id FROM public.pro_profiles WHERE id = (SELECT pro_id FROM public.bookings WHERE id = booking_id)
  )
);
CREATE POLICY "System can insert booking events" ON public.booking_events FOR INSERT WITH CHECK (true);

-- Create RLS policies for payments table
CREATE POLICY "Payment participants can view payments" ON public.payments FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = pro_id
);

-- Create RLS policies for payouts table
CREATE POLICY "Pros can view their own payouts" ON public.payouts FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.pro_profiles WHERE id = pro_id)
);

-- Create RLS policies for chat_threads table
CREATE POLICY "Chat participants can view threads" ON public.chat_threads FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.bookings WHERE id = booking_id
    UNION
    SELECT user_id FROM public.pro_profiles WHERE id = (SELECT pro_id FROM public.bookings WHERE id = booking_id)
  )
);

-- Create RLS policies for chat_messages table
CREATE POLICY "Chat participants can view messages" ON public.chat_messages FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.bookings b 
    JOIN public.chat_threads ct ON b.id = ct.booking_id 
    WHERE ct.id = thread_id
    UNION
    SELECT user_id FROM public.pro_profiles pp 
    JOIN public.bookings b ON pp.id = b.pro_id
    JOIN public.chat_threads ct ON b.id = ct.booking_id 
    WHERE ct.id = thread_id
  )
);
CREATE POLICY "Chat participants can send messages" ON public.chat_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND auth.uid() IN (
    SELECT user_id FROM public.bookings b 
    JOIN public.chat_threads ct ON b.id = ct.booking_id 
    WHERE ct.id = thread_id
    UNION
    SELECT user_id FROM public.pro_profiles pp 
    JOIN public.bookings b ON pp.id = b.pro_id
    JOIN public.chat_threads ct ON b.id = ct.booking_id 
    WHERE ct.id = thread_id
  )
);

-- Create RLS policies for reviews table
CREATE POLICY "Reviews are publicly viewable" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for their bookings" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id AND auth.uid() IN (
    SELECT user_id FROM public.bookings WHERE id = booking_id
    UNION
    SELECT user_id FROM public.pro_profiles WHERE id = (SELECT pro_id FROM public.bookings WHERE id = booking_id)
  )
);

-- Create RLS policies for disputes table
CREATE POLICY "Dispute participants can view disputes" ON public.disputes FOR SELECT USING (
  auth.uid() = opener_id OR auth.uid() IN (
    SELECT user_id FROM public.bookings WHERE id = booking_id
    UNION
    SELECT user_id FROM public.pro_profiles WHERE id = (SELECT pro_id FROM public.bookings WHERE id = booking_id)
  )
);
CREATE POLICY "Booking participants can create disputes" ON public.disputes FOR INSERT WITH CHECK (
  auth.uid() = opener_id AND auth.uid() IN (
    SELECT user_id FROM public.bookings WHERE id = booking_id
    UNION
    SELECT user_id FROM public.pro_profiles WHERE id = (SELECT pro_id FROM public.bookings WHERE id = booking_id)
  )
);

-- Insert initial service categories
INSERT INTO public.service_categories (name, slug, icon) VALUES
('Cleaning', 'cleaning', '🧹'),
('Moving', 'moving', '📦'),
('Handyman', 'handyman', '🔧'),
('Babysitting', 'babysitting', '👶'),
('Dog Walking', 'dog-walking', '🐕'),
('AC Repair', 'ac-repair', '❄️'),
('Plumbing', 'plumbing', '🚿'),
('Electrical', 'electrical', '⚡'),
('Gardening', 'gardening', '🌱'),
('Photography', 'photography', '📸');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pro_profiles_updated_at BEFORE UPDATE ON public.pro_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pro_services_updated_at BEFORE UPDATE ON public.pro_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON public.availability_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
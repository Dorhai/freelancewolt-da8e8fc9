-- Create table for tracking provider real-time locations
CREATE TABLE public.provider_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pro_id UUID NOT NULL REFERENCES public.pro_profiles(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION, -- Direction of movement
  speed DOUBLE PRECISION, -- Speed in km/h
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient location queries
CREATE INDEX idx_provider_locations_pro_id ON public.provider_locations(pro_id);
CREATE INDEX idx_provider_locations_available ON public.provider_locations(is_available, is_online);
CREATE INDEX idx_provider_locations_coords ON public.provider_locations(lat, lng);

-- Enable RLS
ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Provider locations are publicly viewable for available providers" 
ON public.provider_locations 
FOR SELECT 
USING (is_online = true AND is_available = true);

CREATE POLICY "Providers can update their own location" 
ON public.provider_locations 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM pro_profiles 
  WHERE pro_profiles.id = provider_locations.pro_id 
  AND pro_profiles.user_id = auth.uid()
));

-- Add availability status to pro_profiles
ALTER TABLE public.pro_profiles 
ADD COLUMN is_available_now BOOLEAN DEFAULT true,
ADD COLUMN estimated_arrival_time INTEGER DEFAULT 30; -- minutes

-- Create trigger to update location timestamp
CREATE OR REPLACE FUNCTION public.update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_locations_timestamp
  BEFORE UPDATE ON public.provider_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_location_timestamp();

-- Enable realtime for provider locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_locations;
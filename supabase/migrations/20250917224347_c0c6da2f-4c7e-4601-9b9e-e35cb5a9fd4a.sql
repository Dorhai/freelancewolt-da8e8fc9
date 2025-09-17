-- Update existing pro profiles with Tel Aviv coordinates for testing
UPDATE public.pro_profiles 
SET 
  lat = 32.0853 + (random() - 0.5) * 0.02,
  lng = 34.7818 + (random() - 0.5) * 0.02,
  verification_status = 'verified',
  company_name = COALESCE(company_name, 'Test Service Provider'),
  bio = COALESCE(bio, 'Professional service provider'),
  avg_price_hint = COALESCE(avg_price_hint, 50)
WHERE lat IS NULL OR lng IS NULL OR verification_status != 'verified';
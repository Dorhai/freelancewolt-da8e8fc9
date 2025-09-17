-- Insert mock users first
INSERT INTO public.users (id, email, first_name, last_name, photo_url, rating_avg, rating_count) VALUES
('11111111-1111-1111-1111-111111111111', 'john.smith@example.com', 'John', 'Smith', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 4.8, 47),
('22222222-2222-2222-2222-222222222222', 'maria.garcia@example.com', 'Maria', 'Garcia', 'https://images.unsplash.com/photo-1494790108755-2616b612b950?w=150', 4.9, 62),
('33333333-3333-3333-3333-333333333333', 'david.johnson@example.com', 'David', 'Johnson', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 4.7, 38),
('44444444-4444-4444-4444-444444444444', 'sarah.wilson@example.com', 'Sarah', 'Wilson', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 4.9, 89),
('55555555-5555-5555-5555-555555555555', 'mike.brown@example.com', 'Mike', 'Brown', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', 4.6, 23)
ON CONFLICT (id) DO NOTHING;

-- Insert mock pro profiles
INSERT INTO public.pro_profiles (id, user_id, company_name, bio, lat, lng, service_radius_km, avg_price_hint, verification_status) VALUES
('aaaa1111-aaaa-1111-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', 'Smith Plumbing Services', 'Professional plumbing services with 15+ years experience. Emergency repairs, installations, and maintenance.', 40.7580, -73.9855, 25, 85, 'verified'),
('bbbb2222-bbbb-2222-bbbb-222222222222', '22222222-2222-2222-2222-222222222222', 'Garcia Cleaning Co', 'Reliable house cleaning services. Eco-friendly products, flexible scheduling, and attention to detail.', 40.7505, -73.9934, 20, 45, 'verified'),
('cccc3333-cccc-3333-cccc-333333333333', '33333333-3333-3333-3333-333333333333', 'Johnson Handyman Services', 'Your go-to handyman for all home repairs. From fixing leaky faucets to painting rooms.', 40.7614, -73.9776, 30, 65, 'verified'),
('dddd4444-dddd-4444-dddd-444444444444', '44444444-4444-4444-4444-444444444444', 'Wilson Electric', 'Licensed electrician offering residential and commercial electrical services. Safety is our priority.', 40.7489, -73.9680, 35, 95, 'verified'),
('eeee5555-eeee-5555-eeee-555555555555', '55555555-5555-5555-5555-555555555555', 'Brown Moving Company', 'Professional moving services for local and long-distance relocations. Careful handling guaranteed.', 40.7282, -73.9942, 50, 120, 'verified')
ON CONFLICT (id) DO NOTHING;

-- Insert mock services for these providers
INSERT INTO public.pro_services (id, pro_id, category_id, description, price, pricing_type, min_hours) VALUES
('srv11111-1111-1111-1111-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', (SELECT id FROM service_categories WHERE slug = 'plumbing'), 'Emergency plumbing repairs and installations', 85.00, 'hourly', 1),
('srv22222-2222-2222-2222-222222222222', 'bbbb2222-bbbb-2222-bbbb-222222222222', (SELECT id FROM service_categories WHERE slug = 'cleaning'), 'Deep house cleaning service', 45.00, 'hourly', 2),
('srv33333-3333-3333-3333-333333333333', 'cccc3333-cccc-3333-cccc-333333333333', (SELECT id FROM service_categories WHERE slug = 'handyman'), 'General handyman and repair services', 65.00, 'hourly', 1),
('srv44444-4444-4444-4444-444444444444', 'dddd4444-dddd-4444-dddd-444444444444', (SELECT id FROM service_categories WHERE slug = 'electrical'), 'Electrical repairs and installations', 95.00, 'hourly', 1),
('srv55555-5555-5555-5555-555555555555', 'eeee5555-eeee-5555-eeee-555555555555', (SELECT id FROM service_categories WHERE slug = 'moving'), 'Professional moving and packing', 120.00, 'hourly', 4)
ON CONFLICT (id) DO NOTHING;
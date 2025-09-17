import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { BookingModal } from '@/components/BookingModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, MapPin, Filter, Star, Clock } from 'lucide-react';

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface ServiceProvider {
  id: string;
  user_id: string;
  company_name: string;
  bio: string;
  lat: number;
  lng: number;
  service_radius_km: number;
  verification_status: string;
  avg_price_hint: number;
  user: {
    first_name: string;
    last_name: string;
    photo_url: string;
    rating_avg: number;
    rating_count: number;
  };
  services: {
    id: string;
    description: string;
    price: number;
    pricing_type: string;
    category: {
      name: string;
      icon: string;
    };
  }[];
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingProvider, setBookingProvider] = useState<ServiceProvider | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Get first name from email or user metadata
  const getFirstName = () => {
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.split(' ')[0];
    }
    if (user?.email) {
      // Extract first part before @ and capitalize
      const emailPart = user.email.split('@')[0];
      return emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
    }
    return 'User';
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchProviders();
      fetchMapboxToken();
      getUserLocation();
    }
  }, [user]);

  useEffect(() => {
    filterProviders();
  }, [searchQuery, selectedCategories, providers]);

  useEffect(() => {
    if (mapboxToken && mapContainer.current) {
      initializeMap();
    }
  }, [mapboxToken, userLocation]);

  useEffect(() => {
    if (map.current && filteredProviders.length > 0) {
      addProvidersToMap();
    }
  }, [filteredProviders]);

  const fetchMapboxToken = async () => {
    try {
      const response = await fetch('https://pfwapkdaxjtgwbncwynp.supabase.co/functions/v1/get-mapbox-token', {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2Fwa2RheGp0Z3dibmN3eW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTc0OTAsImV4cCI6MjA3MzYzMzQ5MH0.av0228UrPoRATjpeLzApKXg1UZXF0GJT68HVRk19Ta8',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMapboxToken(data.token);
      }
    } catch (error) {
      console.error('Error fetching Mapbox token:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Default to a central location if geolocation fails
          setUserLocation({ lat: 40.7128, lng: -74.0060 }); // NYC
        }
      );
    }
  };

  const initializeMap = () => {
    if (!mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    const center: [number, number] = userLocation ? [userLocation.lng, userLocation.lat] : [-74.0060, 40.7128];
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add user location marker if available
    if (userLocation) {
      new mapboxgl.Marker({ color: '#FF385C' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<div>Your Location</div>'))
        .addTo(map.current);
    }
  };

  const addProvidersToMap = () => {
    if (!map.current) return;

    // Remove existing markers (you might want to store marker references to clean up properly)
    filteredProviders.forEach(provider => {
      if (provider.lat && provider.lng) {
        const el = document.createElement('div');
        el.className = 'w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer flex items-center justify-center text-white text-xs font-bold';
        el.innerHTML = '🔧';
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([provider.lng, provider.lat])
          .addTo(map.current!);

        // Add click event
        el.addEventListener('click', () => {
          setSelectedProvider(provider);
        });
      }
    });
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('pro_profiles')
        .select(`
          *,
          user:users(*),
          services:pro_services(
            *,
            category:service_categories(*)
          )
        `)
        .eq('verification_status', 'verified')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) throw error;
      setProviders(data || []);
      setFilteredProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const filterProviders = () => {
    let filtered = providers;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(provider => 
        provider.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.services.some(service => 
          service.category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(provider =>
        provider.services.some(service =>
          selectedCategories.includes(service.category.name)
        )
      );
    }

    setFilteredProviders(filtered);
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleBookProvider = (provider: ServiceProvider) => {
    setBookingProvider(provider);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    // Refresh providers or update state as needed
    fetchProviders();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {getFirstName()}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Find the perfect service provider for your needs
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
          {/* Left Sidebar - Search and Filters */}
          <div className="lg:w-2/5 space-y-4 overflow-y-auto">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search services, providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filters */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Service Categories</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategories.includes(category.name) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category.name)}
                  >
                    {category.icon} {category.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Results */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                {filteredProviders.length} service providers found
              </p>
              
              <div className="space-y-3">
                {filteredProviders.map((provider) => (
                  <Card
                    key={provider.id}
                    className={`cursor-pointer hover:shadow-md transition-all ${
                      selectedProvider?.id === provider.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                          {provider.user?.photo_url ? (
                            <img 
                              src={provider.user.photo_url} 
                              alt={provider.company_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold">
                              {provider.company_name?.[0] || 'P'}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {provider.company_name || `${provider.user?.first_name} ${provider.user?.last_name}`}
                          </h3>
                          
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs ml-1">
                                {provider.user?.rating_avg || 0} ({provider.user?.rating_count || 0})
                              </span>
                            </div>
                            {provider.avg_price_hint && (
                              <span className="text-xs text-muted-foreground">
                                From ${provider.avg_price_hint}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {provider.bio}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {provider.services.slice(0, 2).map((service) => (
                              <Badge key={service.id} variant="secondary" className="text-xs">
                                {service.category.icon} {service.category.name}
                              </Badge>
                            ))}
                            {provider.services.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{provider.services.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Map */}
          <div className="lg:w-3/5 relative">
            <div ref={mapContainer} className="w-full h-full rounded-lg" />
            
            {/* Selected Provider Info Overlay */}
            {selectedProvider && (
              <Card className="absolute bottom-4 left-4 right-4 z-10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                        {selectedProvider.user?.photo_url ? (
                          <img 
                            src={selectedProvider.user.photo_url} 
                            alt={selectedProvider.company_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold">
                            {selectedProvider.company_name?.[0] || 'P'}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">
                          {selectedProvider.company_name || `${selectedProvider.user?.first_name} ${selectedProvider.user?.last_name}`}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{selectedProvider.user?.rating_avg || 0} ({selectedProvider.user?.rating_count || 0} reviews)</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleBookProvider(selectedProvider)}
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Booking Modal */}
        <BookingModal
          provider={bookingProvider}
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingProvider(null);
          }}
          onBookingSuccess={handleBookingSuccess}
        />
      </div>
    </div>
  );
}
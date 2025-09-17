import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { BookingModal } from '@/components/BookingModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Search, Filter, Navigation, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceProvider {
  id: string;
  user_id: string;
  bio: string;
  company_name: string;
  service_radius_km: number;
  base_city: string;
  lat: number;
  lng: number;
  verification_status: string;
  avg_price_hint: number;
  user: {
    first_name: string;
    last_name: string;
    rating_avg: number;
    rating_count: number;
    photo_url: string;
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

export default function MapPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tokenLoading, setTokenLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);

  // Redirect to auth if not logged in and fetch Mapbox token
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Fetch Mapbox token from edge function
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        toast({
          title: "Error",
          description: "Failed to load map configuration. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setTokenLoading(false);
      }
    };

    fetchMapboxToken();
  }, [user, navigate, toast]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setUserLocation(coords);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            variant: "destructive",
            title: "Location access denied",
            description: "Please enable location services to find nearby providers.",
          });
          // Default to Tel Aviv coordinates where our mock data is located
          setUserLocation([34.7818, 32.0853]);
        }
      );
    }
  }, [toast]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !userLocation || !mapboxToken || tokenLoading) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: userLocation,
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

     // Add user location marker with data attribute
     const userMarker = new mapboxgl.Marker({ color: '#FF385C' })
       .setLngLat(userLocation)
       .setPopup(new mapboxgl.Popup().setHTML('<div><strong>Your Location</strong></div>'))
       .addTo(map.current);
     
     // Add data attribute to identify user marker
     const userMarkerEl = userMarker.getElement();
     if (userMarkerEl) {
       userMarkerEl.setAttribute('data-user-location', 'true');
     }

    // Fetch and display service providers
    fetchNearbyProviders();

    return () => {
      map.current?.remove();
    };
  }, [userLocation, mapboxToken, tokenLoading]);

  const fetchNearbyProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('pro_profiles')
        .select(`
          *,
          user:users(first_name, last_name, rating_avg, rating_count, photo_url),
          services:pro_services(
            id,
            description,
            price,
            pricing_type,
            category:service_categories(name, icon)
          )
        `)
        .eq('verification_status', 'verified')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) throw error;

      console.log('Fetched providers:', data);

      const providersData = data?.map(provider => ({
        ...provider,
        user: Array.isArray(provider.user) ? provider.user[0] : provider.user,
        services: provider.services || []
      })) || [];

      console.log('Processed providers for map:', providersData);
      setProviders(providersData);

      // Clear existing markers
      if (map.current) {
        // Remove existing provider markers (keep user location marker)
        const markers = document.querySelectorAll('.marker-provider');
        markers.forEach(marker => marker.remove());
        
        // Also remove any existing mapbox markers except user location
        const existingMarkers = document.querySelectorAll('.mapboxgl-marker:not([data-user-location])');
        existingMarkers.forEach(marker => {
          const parent = marker.parentElement;
          if (parent && parent.querySelector('.marker-provider')) {
            parent.remove();
          }
        });
      }

      // Add markers for each provider
      providersData.forEach((provider) => {
        console.log('Adding marker for provider:', provider.company_name, 'at', provider.lat, provider.lng);
        if (map.current && provider.lat && provider.lng) {
          // Create custom marker element with person icon (blue style like in image)
          const markerEl = document.createElement('div');
          markerEl.className = 'marker-provider';
          markerEl.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          `;
          markerEl.style.cssText = `
            width: 36px;
            height: 36px;
            background: #3B82F6;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 1000;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          `;

          const marker = new mapboxgl.Marker({ element: markerEl })
            .setLngLat([provider.lng, provider.lat])
            .addTo(map.current);

          // Hover tooltip
          const tooltip = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 15
          });

          markerEl.addEventListener('mouseenter', () => {
            setHoveredProvider(provider.id);
            markerEl.style.transform = 'scale(1.15)';
            markerEl.style.background = '#2563EB';
            markerEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
            
            tooltip
              .setLngLat([provider.lng, provider.lat])
              .setHTML(`
                <div class="p-3 min-w-[200px]">
                  <div class="flex items-center gap-2 mb-2">
                    <h4 class="font-semibold text-sm">${provider.company_name || `${provider.user?.first_name} ${provider.user?.last_name}`}</h4>
                  </div>
                  <p class="text-xs text-gray-600 mb-2">${provider.bio || 'Service Provider'}</p>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs">⭐ ${provider.user?.rating_avg?.toFixed(1) || 'New'}</span>
                    <span class="text-xs text-gray-500">(${provider.user?.rating_count || 0} reviews)</span>
                  </div>
                  <div class="text-xs font-medium text-blue-600">
                    Starting from $${provider.avg_price_hint || 50}/hour
                  </div>
                </div>
              `)
              .addTo(map.current!);
          });

          markerEl.addEventListener('mouseleave', () => {
            setHoveredProvider(null);
            markerEl.style.transform = 'scale(1)';
            markerEl.style.background = '#3B82F6';
            markerEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            tooltip.remove();
          });

          markerEl.addEventListener('click', () => {
            setSelectedProvider(provider);
            tooltip.remove();
          });

          console.log('Marker added for:', provider.company_name);
        }
      });
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        variant: "destructive",
        title: "Failed to load providers",
        description: "Please try again later.",
      });
    }
  };

  const centerOnUserLocation = () => {
    if (map.current && userLocation) {
      map.current.flyTo({
        center: userLocation,
        zoom: 14,
        duration: 1000
      });
    }
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative h-screen">
        {/* Loading indicator */}
        {tokenLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-96">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading map configuration...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Bar */}
        <div className="absolute top-4 left-4 z-10 w-80">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white shadow-lg"
              />
            </div>
            <Button size="icon" variant="outline" className="bg-white shadow-lg">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Location Button */}
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            size="icon"
            onClick={centerOnUserLocation}
            className="bg-white shadow-lg text-gray-700 hover:bg-gray-50"
            variant="outline"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>

        {/* Map Container */}
        <div ref={mapContainer} className="w-full h-full" />

        {/* Provider Details Panel */}
        {selectedProvider && (
          <div className="absolute bottom-4 left-4 z-10 w-80">
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {selectedProvider.company_name || 
                       `${selectedProvider.user?.first_name} ${selectedProvider.user?.last_name}`}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedProvider.base_city}
                    </p>
                    <p className="text-sm mb-3">
                      {selectedProvider.bio}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>⭐ {selectedProvider.user?.rating_avg?.toFixed(1) || 'New'}</span>
                      <span>({selectedProvider.user?.rating_count || 0} reviews)</span>
                      <span>📍 {selectedProvider.service_radius_km}km radius</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setSelectedProvider(null)}
                    variant="ghost"
                  >
                    ✕
                  </Button>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setIsBookingModalOpen(true);
                    }}
                  >
                    Book Now
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Booking Modal */}
        <BookingModal
          provider={selectedProvider}
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedProvider(null);
          }}
          onBookingSuccess={() => {
            toast({
              title: "Booking Confirmed!",
              description: "Your appointment has been scheduled successfully."
            });
          }}
        />

        {/* Legend */}
        <div className="absolute top-20 left-4 z-10">
          <Card className="shadow-lg">
            <CardContent className="p-3 space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Service Providers</span>
          </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import mapboxgl from 'mapbox-gl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProviderLocation {
  id: string;
  pro_id: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  is_available: boolean;
  is_online: boolean;
  last_updated: string;
}

interface ServiceProvider {
  id: string;
  company_name: string;
  user: {
    first_name: string;
    last_name: string;
    photo_url: string;
  };
}

interface RealtimeLocationTrackerProps {
  providerId: string;
  provider: ServiceProvider;
  userLocation: {lat: number; lng: number} | null;
  mapboxToken: string;
  onProviderArrival?: () => void;
}

export function RealtimeLocationTracker({ 
  providerId, 
  provider, 
  userLocation, 
  mapboxToken,
  onProviderArrival 
}: RealtimeLocationTrackerProps) {
  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<number>(0);
  const [isTracking, setIsTracking] = useState(true);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const providerMarker = useRef<mapboxgl.Marker | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !userLocation || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [userLocation.lng, userLocation.lat],
      zoom: 14
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add user location marker
    userMarker.current = new mapboxgl.Marker({ color: '#FF385C' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<div><strong>Your Location</strong></div>'))
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [userLocation, mapboxToken]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!providerId) return;

    // Fetch initial location
    const fetchProviderLocation = async () => {
      const { data, error } = await supabase
        .from('provider_locations')
        .select('*')
        .eq('pro_id', providerId)
        .eq('is_online', true)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setProviderLocation(data);
      }
    };

    fetchProviderLocation();

    // Set up real-time subscription
    const channel = supabase
      .channel('provider-location-tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'provider_locations',
          filter: `pro_id=eq.${providerId}`
        },
        (payload) => {
          console.log('Provider location update:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newLocation = payload.new as ProviderLocation;
            if (newLocation.is_online) {
              setProviderLocation(newLocation);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [providerId]);

  // Update map with provider location
  useEffect(() => {
    if (!map.current || !providerLocation || !userLocation) return;

    // Remove existing provider marker
    if (providerMarker.current) {
      providerMarker.current.remove();
    }

    // Create provider marker with direction indicator
    const markerEl = document.createElement('div');
    markerEl.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: #2563EB;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transform: rotate(${providerLocation.heading || 0}deg);
        transition: transform 0.3s ease;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M12 2l7 10-7 2-7-2z"/>
        </svg>
      </div>
    `;

    providerMarker.current = new mapboxgl.Marker({ element: markerEl })
      .setLngLat([providerLocation.lng, providerLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div>
          <strong>${provider.company_name}</strong><br>
          <small>Moving at ${providerLocation.speed?.toFixed(1) || 0} km/h</small><br>
          <small>Last update: ${new Date(providerLocation.last_updated).toLocaleTimeString()}</small>
        </div>
      `))
      .addTo(map.current);

    // Calculate estimated arrival time
    calculateArrivalTime();

    // Fit map to show both locations
    const bounds = new mapboxgl.LngLatBounds()
      .extend([userLocation.lng, userLocation.lat])
      .extend([providerLocation.lng, providerLocation.lat]);
    
    map.current.fitBounds(bounds, { padding: 50 });

  }, [providerLocation, userLocation, provider.company_name]);

  const calculateArrivalTime = () => {
    if (!providerLocation || !userLocation) return;

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (userLocation.lat - providerLocation.lat) * Math.PI / 180;
    const dLng = (userLocation.lng - providerLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(providerLocation.lat * Math.PI / 180) * Math.cos(userLocation.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km

    // Estimate arrival time based on current speed or average city speed
    const speed = providerLocation.speed || 30; // Default 30 km/h if no speed data
    const estimatedMinutes = (distance / speed) * 60;
    
    setEstimatedArrival(Math.max(1, Math.round(estimatedMinutes)));

    // Check if provider is very close (within 100m)
    if (distance < 0.1 && onProviderArrival) {
      onProviderArrival();
    }
  };

  const getStatusColor = () => {
    if (!providerLocation) return 'bg-gray-500';
    if (!providerLocation.is_online) return 'bg-gray-500';
    if (estimatedArrival <= 2) return 'bg-green-500';
    if (estimatedArrival <= 10) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (!providerLocation) return 'Connecting...';
    if (!providerLocation.is_online) return 'Offline';
    if (estimatedArrival <= 2) return 'Arriving now';
    return `${estimatedArrival} min away`;
  };

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
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
              
              <div>
                <h3 className="font-semibold">{provider.company_name}</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
                  <span className="text-sm text-muted-foreground">
                    {getStatusText()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ETA: {estimatedArrival} min
              </Badge>
              
              {providerLocation && (
                <div className="text-xs text-muted-foreground">
                  {providerLocation.speed && `${providerLocation.speed.toFixed(1)} km/h`}
                  <span className="mx-1">•</span>
                  {new Date(providerLocation.last_updated).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call Provider
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsTracking(!isTracking)}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      {isTracking && (
        <Card>
          <CardContent className="p-0">
            <div 
              ref={mapContainer} 
              className="w-full h-80 rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Distance Info */}
      {providerLocation && userLocation && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Provider Location</span>
              </div>
              <span className="text-muted-foreground">
                Last updated: {new Date(providerLocation.last_updated).toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
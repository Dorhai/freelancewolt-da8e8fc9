import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, Star, DollarSign, User, Clock, MapPin, Zap } from 'lucide-react';

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
  estimated_arrival_time: number;
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

interface ImmediateBookingModalProps {
  provider: ServiceProvider | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export function ImmediateBookingModal({ provider, isOpen, onClose, onBookingSuccess }: ImmediateBookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedService, setSelectedService] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    phone: '',
    email: user?.email || '',
    address: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!provider || !selectedService) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a service."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create immediate booking (starts in 5 minutes)
      const now = new Date();
      const scheduledStart = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
      const estimatedEnd = new Date(scheduledStart.getTime() + provider.estimated_arrival_time * 60000 + 2 * 60 * 60000); // arrival time + 2 hours work

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user?.id,
          pro_id: provider.id,
          service_id: selectedService,
          scheduled_start: scheduledStart.toISOString(),
          scheduled_end: estimatedEnd.toISOString(),
          notes: formData.notes,
          status: 'confirmed' // Immediate booking is auto-confirmed
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Store service address
      if (formData.address) {
        await supabase
          .from('addresses')
          .insert({
            user_id: user?.id,
            line1: formData.address,
            label: 'Service Location',
            is_default: false
          });
      }

      // Send immediate notification
      try {
        const selectedServiceData = provider.services.find(s => s.id === selectedService);
        const arrivalTime = new Date(now.getTime() + provider.estimated_arrival_time * 60000);
        const arrivalTimeStr = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const notificationMessage = `🚀 Immediate Service Booked!

Hi ${formData.firstName}!

Your service provider is on the way:

👨‍💼 Provider: ${provider.company_name}
⏰ Estimated Arrival: ${arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (~${provider.estimated_arrival_time} min)
🏠 Address: ${formData.address}
💼 Service: ${selectedServiceData?.category.name}

You can track their location in real-time on the map!

Thank you for choosing our service! 🎉`;

        await supabase.functions.invoke('send-sms-notification', {
          body: {
            to: formData.phone,
            message: notificationMessage,
            type: 'immediate_booking'
          }
        });
      } catch (smsError) {
        console.error('Failed to send SMS notification:', smsError);
      }
      
      toast({
        title: "Service Provider On The Way! 🚀",
        description: `${provider.company_name} will arrive in approximately ${provider.estimated_arrival_time} minutes.`
      });

      onBookingSuccess();
      onClose();
      resetForm();

    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error.message || "There was an error creating your booking. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedService('');
    setFormData({
      firstName: user?.user_metadata?.first_name || '',
      lastName: user?.user_metadata?.last_name || '',
      phone: '',
      email: user?.email || '',
      address: '',
      notes: ''
    });
  };

  if (!provider) return null;

  const selectedServiceData = provider.services.find(s => s.id === selectedService);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              Instant Service Request
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Service provider will arrive in ~{provider.estimated_arrival_time} minutes</span>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Provider Info */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                    {provider.user?.photo_url ? (
                      <img 
                        src={provider.user.photo_url} 
                        alt={provider.company_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold text-lg">
                        {provider.company_name?.[0] || 'P'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <CardTitle className="text-xl">
                      {provider.company_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 font-medium">
                          {provider.user?.rating_avg || 0}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          ({provider.user?.rating_count || 0} reviews)
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      <Clock className="h-3 w-3 mr-1" />
                      Available Now
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{provider.bio}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {provider.user?.first_name} {provider.user?.last_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Starting from ${provider.avg_price_hint}/hour
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      ETA: ~{provider.estimated_arrival_time} minutes
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Select Service</h4>
                  <div className="space-y-2">
                    {provider.services.map((service) => (
                      <div 
                        key={service.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedService === service.id 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{service.category.icon}</span>
                            <span className="font-medium">{service.category.name}</span>
                          </div>
                          <Badge variant="outline">
                            ${service.price}/{service.pricing_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Service Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="123 Main St, City, State 12345"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {selectedServiceData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Service Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <span className="font-medium">{selectedServiceData.category.name}</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          Starting in ~5 minutes
                        </p>
                      </div>
                      <Badge>
                        ${selectedServiceData.price}/{selectedServiceData.pricing_type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Estimated arrival: {provider.estimated_arrival_time} minutes
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any special instructions for the service provider..."
                    rows={3}
                  />
                </CardContent>
              </Card>
            </form>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedService}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Booking...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Book Now - Arrives in {provider.estimated_arrival_time}min
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
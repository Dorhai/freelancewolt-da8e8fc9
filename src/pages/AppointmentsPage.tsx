import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';

interface Booking {
  id: string;
  user_id: string;
  pro_id: string;
  service_id: string;
  scheduled_start: string;
  scheduled_end: string;
  notes: string;
  status: string;
  created_at: string;
  pro_profile: {
    id: string;
    company_name: string;
    user: {
      first_name: string;
      last_name: string;
      photo_url: string;
      phone: string;
      email: string;
    };
  };
  service: {
    id: string;
    description: string;
    price: number;
    pricing_type: string;
    category: {
      name: string;
      icon: string;
    };
  };
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: 'bg-green-500', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-500', icon: Clock },
  completed: { label: 'Completed', color: 'bg-gray-500', icon: CheckCircle },
  canceled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
};

export default function AppointmentsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          pro_profile:pro_profiles(
            id,
            company_name,
            user:users(
              first_name,
              last_name,
              photo_url,
              phone,
              email
            )
          ),
          service:pro_services(
            id,
            description,
            price,
            pricing_type,
            category:service_categories(
              name,
              icon
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('scheduled_start', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your appointments."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'canceled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been successfully cancelled."
      });

      fetchBookings(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel the appointment."
      });
    }
  };

  const filterBookingsByStatus = (status: string) => {
    if (status === 'all') return bookings;
    return bookings.filter(booking => booking.status === status);
  };

  const getUpcomingBookings = () => {
    const now = new Date();
    return bookings.filter(booking => 
      new Date(booking.scheduled_start) > now && 
      !['cancelled', 'completed'].includes(booking.status)
    );
  };

  const getPastBookings = () => {
    const now = new Date();
    return bookings.filter(booking => 
      new Date(booking.scheduled_start) <= now || 
      ['canceled', 'completed'].includes(booking.status)
    );
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const StatusIcon = statusConfig[booking.status]?.icon || AlertCircle;
    const canCancel = ['pending', 'confirmed'].includes(booking.status) && 
                     new Date(booking.scheduled_start) > new Date();

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={booking.pro_profile?.user?.photo_url} />
                <AvatarFallback>
                  {booking.pro_profile?.company_name?.[0] || 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {booking.pro_profile?.company_name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {booking.pro_profile?.user?.first_name} {booking.pro_profile?.user?.last_name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline"
                className={`${statusConfig[booking.status]?.color} text-white border-none`}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[booking.status]?.label || booking.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Service Info */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-lg">{booking.service?.category?.icon}</span>
            <div className="flex-1">
              <p className="font-medium">{booking.service?.category?.name}</p>
              <p className="text-sm text-muted-foreground">
                {booking.service?.description}
              </p>
            </div>
            <Badge variant="secondary">
              ${booking.service?.price}/{booking.service?.pricing_type}
            </Badge>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(booking.scheduled_start), 'PPP')}
                </p>
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(booking.scheduled_start), 'p')} - {format(new Date(booking.scheduled_end), 'p')}
                </p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm">{booking.pro_profile?.user?.phone || 'Not provided'}</p>
                <p className="text-xs text-muted-foreground">Phone</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm truncate">{booking.pro_profile?.user?.email}</p>
                <p className="text-xs text-muted-foreground">Email</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground">{booking.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              Contact Provider
            </Button>
            {canCancel && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleCancelBooking(booking.id)}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Manage your scheduled services and appointments
          </p>
        </div>

        {bookings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No appointments yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't booked any services yet. Start by browsing available providers.
              </p>
              <Button asChild>
                <a href="/dashboard">Find Services</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="upcoming">
                Upcoming ({getUpcomingBookings().length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({getPastBookings().length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {getUpcomingBookings().length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No upcoming appointments</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {getUpcomingBookings().map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {getPastBookings().length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No past appointments</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {getPastBookings().map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { ServiceCategories } from '@/components/ServiceCategories';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Star, Clock, Shield } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Book local services
            <span className="text-primary block">instantly</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find trusted professionals near you for cleaning, repairs, moving, and more. 
            Book in minutes, pay securely, get it done.
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link to="/map">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <MapPin className="mr-2 h-4 w-4" />
                  Explore Map
                </Button>
              </Link>
            </div>
          )}
          
          {user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link to="/map">
                <Button size="lg" className="w-full sm:w-auto">
                  <MapPin className="mr-2 h-4 w-4" />
                  Find Services Near Me
                </Button>
              </Link>
              <Link to="/pro/apply">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Become a Pro
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Service Categories */}
      <section className="container mx-auto px-4 py-12">
        <ServiceCategories />
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why choose FreelancerWolt?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Instant Booking</h3>
              <p className="text-muted-foreground">
                Book services in real-time based on availability. No waiting, no back and forth.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Secure Payments</h3>
              <p className="text-muted-foreground">
                Pay securely with escrow protection. Money held safely until job completion.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Star className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Verified Pros</h3>
              <p className="text-muted-foreground">
                All professionals are verified and rated by real customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of satisfied customers who trust FreelancerWolt for their service needs.
          </p>
          
          {!user ? (
            <Link to="/auth">
              <Button size="lg">
                Sign Up Now
              </Button>
            </Link>
          ) : (
            <Link to="/map">
              <Button size="lg">
                <MapPin className="mr-2 h-4 w-4" />
                Find Services
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;

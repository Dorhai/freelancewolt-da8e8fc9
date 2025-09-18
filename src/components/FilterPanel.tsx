import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, DollarSign, MapPin, Clock, X } from 'lucide-react';

interface FilterPanelProps {
  onFiltersChange: (filters: FilterState) => void;
  userLocation: {lat: number; lng: number} | null;
}

export interface FilterState {
  maxPrice: number;
  maxDistance: number; // in km
  maxArrivalTime: number; // in minutes
  availableNow: boolean;
}

export function FilterPanel({ onFiltersChange, userLocation }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    maxPrice: 200,
    maxDistance: 25,
    maxArrivalTime: 60,
    availableNow: true
  });

  const handleFilterChange = (key: keyof FilterState, value: number | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      maxPrice: 200,
      maxDistance: 25,
      maxArrivalTime: 60,
      availableNow: true
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.maxPrice !== 200 || 
    filters.maxDistance !== 25 || 
    filters.maxArrivalTime !== 60 ||
    !filters.availableNow;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              !
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-80 overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filter Providers</SheetTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              Reset
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Availability Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="availableNow"
                  checked={filters.availableNow}
                  onChange={(e) => handleFilterChange('availableNow', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="availableNow">Available now only</Label>
              </div>
              
              <div className="space-y-2">
                <Label>Max arrival time: {filters.maxArrivalTime} minutes</Label>
                <Slider
                  value={[filters.maxArrivalTime]}
                  onValueChange={(value) => handleFilterChange('maxArrivalTime', value[0])}
                  min={10}
                  max={120}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10min</span>
                  <span>2hr</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Max hourly rate: ${filters.maxPrice}</Label>
                <Slider
                  value={[filters.maxPrice]}
                  onValueChange={(value) => handleFilterChange('maxPrice', value[0])}
                  min={20}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$20</span>
                  <span>$500+</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distance Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Distance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!userLocation && (
                <div className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded">
                  Enable location services for distance-based filtering
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Max distance: {filters.maxDistance} km</Label>
                <Slider
                  value={[filters.maxDistance]}
                  onValueChange={(value) => handleFilterChange('maxDistance', value[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                  disabled={!userLocation}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1km</span>
                  <span>50km</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filters.maxPrice !== 200 && (
                    <Badge variant="secondary">
                      Max price: ${filters.maxPrice}/hr
                    </Badge>
                  )}
                  {filters.maxDistance !== 25 && userLocation && (
                    <Badge variant="secondary">
                      Within {filters.maxDistance}km
                    </Badge>
                  )}
                  {filters.maxArrivalTime !== 60 && (
                    <Badge variant="secondary">
                      Arrives within {filters.maxArrivalTime}min
                    </Badge>
                  )}
                  {!filters.availableNow && (
                    <Badge variant="secondary">
                      All providers
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <Button 
            onClick={() => setIsOpen(false)} 
            className="w-full"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
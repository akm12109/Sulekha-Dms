

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, ArrowRight, MapPin } from 'lucide-react';
import type { Vehicle, Route } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { getVehicles, getRoutes } from '@/lib/firebase/utils';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Skeleton } from '@/components/ui/skeleton';

function RoutesPageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Manage Routes"
        description="Create, view, and assign vehicle routes."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create & Assign New Route</CardTitle>
            <CardDescription>Build a new route by adding stops, then assign it to a vehicle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Vehicle Routes</CardTitle>
            <CardDescription>Overview of the routes assigned to each vehicle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="p-4 border rounded-lg space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function RoutesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const [newRouteName, setNewRouteName] = useState('');
  const [newStop, setNewStop] = useState('');
  const [currentStops, setCurrentStops] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        const [vehiclesData, routesData] = await Promise.all([getVehicles(), getRoutes()]);
        setVehicles(vehiclesData);
        setRoutes(routesData);
        setLoading(false);
    }
    fetchData();
  }, []);

  const handleAddStop = () => {
    if (newStop.trim() && !currentStops.includes(newStop.trim())) {
      setCurrentStops([...currentStops, newStop.trim()]);
      setNewStop('');
    }
  };

  const handleRemoveStop = (stopToRemove: string) => {
    setCurrentStops(currentStops.filter(stop => stop !== stopToRemove));
  };
  
  const handleAssignRoute = async (vehicleId: string) => {
    if (!newRouteName || currentStops.length === 0) {
        toast({ title: "Error", description: "Please provide a route name and at least one stop.", variant: "destructive" });
        return;
    }
     
    try {
        // Create new route in Firestore
        const routeDocRef = await addDoc(collection(db, "routes"), {
            name: newRouteName,
            stops: currentStops,
        });

        // Update vehicle with new routeId
        const vehicleRef = doc(db, "vehicles", vehicleId);
        await updateDoc(vehicleRef, {
            routeId: routeDocRef.id,
            currentStopIndex: 0,
            locationStatus: 'AT_STOP'
        });

        // Update local state
        setVehicles(prev => prev.map(v => v.id === vehicleId ? {...v, routeId: routeDocRef.id, currentStopIndex: 0, locationStatus: 'AT_STOP'} : v));
        setRoutes(prev => [...prev, {id: routeDocRef.id, name: newRouteName, stops: currentStops}]);

        toast({
            title: 'Route Assigned',
            description: `'${newRouteName}' has been assigned to vehicle ${vehicleId}.`
        });
        
        setCurrentStops([]);
        setNewRouteName('');

    } catch (error) {
        console.error("Error assigning route:", error);
        toast({ title: "Error", description: "Failed to assign route.", variant: "destructive" });
    }
  }
  
  if (loading) {
    return <RoutesPageSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Manage Routes"
        description="Create, view, and assign vehicle routes."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Create & Assign New Route</CardTitle>
                <CardDescription>Build a new route by adding stops, then assign it to a vehicle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Step 1: Name Your Route</label>
                    <Input 
                        value={newRouteName}
                        onChange={(e) => setNewRouteName(e.target.value)}
                        placeholder="e.g., Morning Route A"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Step 2: Add Stops</label>
                    <div className="flex gap-2">
                        <Input 
                            value={newStop}
                            onChange={(e) => setNewStop(e.target.value)}
                            placeholder="e.g., Springfield Elementary"
                        />
                        <Button onClick={handleAddStop}>Add Stop</Button>
                    </div>
                </div>

                {currentStops.length > 0 && (
                     <div className="space-y-3">
                        <label className="text-sm font-medium">Route Preview</label>
                        <div className="flex flex-wrap items-center gap-2 p-3 rounded-md bg-muted">
                            {currentStops.map((stop, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="flex items-center gap-2">
                                            <MapPin className="w-3 h-3" />
                                            {stop}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveStop(stop)}>
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                        </Button>
                                    </div>
                                    {index < currentStops.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
               
                {currentStops.length > 0 && (
                    <div className="space-y-2">
                         <label className="text-sm font-medium">Step 3: Assign to Vehicle</label>
                         <div className="flex gap-2">
                            <Select onValueChange={(vehicleId) => handleAssignRoute(vehicleId)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vehicle..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map(vehicle => (
                                        <SelectItem key={vehicle.id} value={vehicle.id}>
                                            {vehicle.model} ({vehicle.licensePlate})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                         </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Current Vehicle Routes</CardTitle>
                <CardDescription>Overview of the routes assigned to each vehicle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {vehicles.map(vehicle => {
                    const route = routes.find(r => r.id === vehicle.routeId);
                    return (
                    <div key={vehicle.id} className="p-4 border rounded-lg">
                        <h3 className="font-semibold">{vehicle.model} - <span className="text-muted-foreground">{vehicle.licensePlate}</span></h3>
                        {route && <p className="text-sm font-medium text-primary">{route.name}</p>}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                           {route?.stops.map((stop, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Badge variant={index === vehicle.currentStopIndex ? "default" : "secondary"}>
                                        {stop}
                                    </Badge>
                                    {index < route.stops.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                                </div>
                            ))}
                            {!route && <p className="text-muted-foreground">No route assigned.</p>}
                        </div>
                    </div>
                    )
                })}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}

'use client';

import type { Driver, Vehicle, Assignment } from '@/lib/types';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Loader2, ServerCrash } from 'lucide-react';

export function AssignmentManager({
  initialDrivers,
  initialVehicles,
}: {
  initialDrivers: Driver[];
  initialVehicles: Vehicle[];
}) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [suggestions, setSuggestions] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSuggest = () => {
    // AI functionality is temporarily disabled.
    setError("AI suggestion feature is temporarily disabled due to dependency issues.");
    // startTransition(async () => {
    //   const result = await getAssignmentSuggestions(drivers, vehicles);
    //   if (result.error) {
    //     setError(result.error);
    //   }
    //   if (result.suggestions) {
    //     setSuggestions(result.suggestions);
    //   }
    // });
  };

  const handleAssign = (driverId: string, vehicleId: string) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, assignedVehicleId: vehicleId } : d));
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, isAvailable: false } : v));
    setSuggestions(prev => prev.filter(s => s.driverId !== driverId));
  }

  const availableDrivers = drivers.filter((d) => !d.assignedVehicleId);
  const availableVehicles = vehicles.filter((v) => v.isAvailable);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Assignment Center</CardTitle>
          <CardDescription>
            View available drivers and vehicles, and get smart assignment suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleSuggest} disabled={true}>
            <Lightbulb className="mr-2 h-4 w-4" />
            Suggest Assignments (Disabled)
          </Button>
           <p className="text-sm text-muted-foreground mt-2">AI suggestions are temporarily unavailable.</p>
        </CardContent>
      </Card>

      {isPending && (
         <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-lg font-semibold">Our AI is finding the best matches...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <ServerCrash className="h-4 w-4" />
          <AlertTitle>Feature Unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {suggestions.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>AI-Powered Suggestions</CardTitle>
                <CardDescription>We've found some optimal pairings for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {suggestions.map(suggestion => {
                    const driver = drivers.find(d => d.id === suggestion.driverId);
                    const vehicle = vehicles.find(v => v.id === suggestion.vehicleId);
                    if (!driver || !vehicle) return null;
                    return (
                        <div key={suggestion.driverId} className="p-4 border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex-1 space-y-2">
                                <h3 className="font-semibold">{driver.name} &rarr; {vehicle.model} ({vehicle.licensePlate})</h3>
                                <p className="text-sm text-muted-foreground italic">"{suggestion.reason}"</p>
                            </div>
                            <Button size="sm" onClick={() => handleAssign(suggestion.driverId, suggestion.vehicleId)}>Confirm Assignment</Button>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Available Drivers ({availableDrivers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableDrivers.length > 0 ? availableDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={driver.avatarUrl} alt={driver.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {driver.name}
                    </TableCell>
                    <TableCell>{driver.currentLocation}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">No drivers available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Available Vehicles ({availableVehicles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableVehicles.length > 0 ? availableVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                        <div>{vehicle.model}</div>
                        <div className="text-xs text-muted-foreground">{vehicle.licensePlate}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vehicle.maintenanceSchedule === 'Service due' ? 'destructive' : 'secondary'}>
                        {vehicle.maintenanceSchedule}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                   <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">No vehicles available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

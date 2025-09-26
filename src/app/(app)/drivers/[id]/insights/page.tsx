
'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Truck, User, Calendar, Gauge, Fuel, IndianRupee, Route, Wrench, Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { getDriver, getVehicles } from '@/lib/firebase/utils';
import type { Driver, Vehicle } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

function DriverInsightsSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Driver Insights"
        description="Loading performance and activity log..."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-10 w-full mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Assigned Vehicle</CardTitle></CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-[90px] w-[120px] rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Overall Performance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-1/4" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity Log</CardTitle>
              <CardDescription>Breakdown of daily mileage and fuel expenses for the assigned vehicle.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Fuel (L)</TableHead>
                    <TableHead>Fuel Cost</TableHead>
                    <TableHead>Maint. Cost</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function DriverInsightsPage() {
  const params = useParams();
  const driverId = params.id as string;
  
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!driverId) return;

    async function fetchData() {
        setLoading(true);
        const driverData = await getDriver(driverId);
        setDriver(driverData);
        if (driverData) {
            if (driverData.assignedVehicleId) {
                const vehicleData = await getVehicles().then(vehicles => vehicles.find(v => v.id === driverData.assignedVehicleId));
                setVehicle(vehicleData || null);
            }
        }
        setLoading(false);
    }
    fetchData();
  }, [driverId]);

  if (loading) {
    return <DriverInsightsSkeleton />;
  }

  if (!driver) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Driver Not Found" />
        <main className="flex-1 p-6">
          <p>The driver you are looking for does not exist.</p>
        </main>
      </div>
    );
  }

  const logs = vehicle ? vehicle.maintenanceLogs || [] : [];
  const totalKmDriven = logs.reduce((total, log) => total + (log.closingKm - log.openingKm), 0);
  const totalFuelCost = logs.reduce((total, log) => total + (log.fuelCost || 0), 0);
  const totalMaintenanceCost = logs.reduce((total, log) => total + (log.maintenanceCost || 0), 0);
  const totalFuelLiters = logs.reduce((total, log) => total + (log.fuelLiters || 0), 0);
  const averageMileage = totalFuelLiters > 0 ? (totalKmDriven / totalFuelLiters).toFixed(2) : 'N/A';

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Driver Insights"
        description={`Performance and activity log for ${driver.name}`}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                     <Avatar className="h-16 w-16">
                        <AvatarImage src={driver.avatarUrl} alt={driver.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{driver.name}</CardTitle>
                        <CardDescription>{driver.contact}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                        <span>License: <Badge variant="secondary">{driver.licenseNumber}</Badge></span>
                    </div>
                     <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Expires: <Badge variant={new Date(driver.licenseExpiry) < new Date() ? 'destructive' : 'outline'}>{new Date(driver.licenseExpiry).toLocaleDateString()}</Badge></span>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Assigned Vehicle</CardTitle>
                </CardHeader>
                <CardContent>
                    {vehicle ? (
                        <Link href={`/vehicles/${vehicle.id}`} className="flex items-center gap-4 group">
                             <Image
                                src={vehicle.imageUrl}
                                alt={vehicle.model}
                                width={120}
                                height={90}
                                className="rounded-md object-cover aspect-[4/3]"
                                data-ai-hint="school bus"
                            />
                            <div className="flex-1">
                                <p className="font-semibold group-hover:underline">{vehicle.model}</p>
                                <p className="text-sm text-muted-foreground">{vehicle.licensePlate}</p>
                            </div>
                        </Link>
                    ) : (
                         <div className="text-center text-muted-foreground py-4">
                            <Truck className="mx-auto h-8 w-8" />
                            <p className="mt-2 text-sm">No vehicle assigned</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Overall Performance</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Route className="w-6 h-6 text-muted-foreground" />
                            <p>Total Distance</p>
                        </div>
                        <p className="font-bold text-lg">{totalKmDriven.toLocaleString()} km</p>
                    </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <IndianRupee className="w-6 h-6 text-muted-foreground" />
                             <p>Total Fuel Cost</p>
                        </div>
                        <p className="font-bold text-lg">₹{totalFuelCost.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Wrench className="w-6 h-6 text-muted-foreground" />
                             <p>Total Maint. Cost</p>
                        </div>
                        <p className="font-bold text-lg">₹{totalMaintenanceCost.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Fuel className="w-6 h-6 text-muted-foreground" />
                            <p>Vehicle Mileage</p>
                        </div>
                        <p className="font-bold text-lg">{averageMileage} km/l</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
           <Card>
                <CardHeader>
                    <CardTitle>Daily Activity Log</CardTitle>
                    <CardDescription>Breakdown of daily mileage and fuel expenses for the assigned vehicle.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Distance</TableHead>
                                <TableHead>Fuel (L)</TableHead>
                                <TableHead>Fuel Cost</TableHead>
                                <TableHead>Maint. Cost</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length > 0 ? (
                                logs.map(log => (
                                    <TableRow key={log.date}>
                                        <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">{(log.closingKm - log.openingKm).toLocaleString()} km</TableCell>
                                        <TableCell>{log.fuelLiters?.toLocaleString() || 'N/A'}</TableCell>
                                        <TableCell>₹{log.fuelCost?.toLocaleString() || 'N/A'}</TableCell>
                                        <TableCell>₹{log.maintenanceCost?.toLocaleString() || 'N/A'}</TableCell>
                                        <TableCell className="max-w-[150px] truncate">{log.notes || 'N/A'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No activity logs found for this driver.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}

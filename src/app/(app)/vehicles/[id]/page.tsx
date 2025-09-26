
'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Truck, User, Calendar, Gauge, Fuel, IndianRupee, Route, Wrench, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import type { Vehicle, Driver } from '@/lib/types';
import { getVehicle, getDrivers } from '@/lib/firebase/utils';
import { Skeleton } from '@/components/ui/skeleton';

function VehicleDetailsSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Loading Vehicle Details..."
        description="Loading analytics and details..."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-3 w-1/2 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Distance, fuel, and cost overview per month.</CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Vehicle Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Certificate Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-6 w-28 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity Log</CardTitle>
            <CardDescription>Breakdown of daily mileage and expenses for this vehicle.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(8)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


export default function VehicleDetailsPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicleId) return;
    async function fetchData() {
        const vehicleData = await getVehicle(vehicleId);
        setVehicle(vehicleData);
        if (vehicleData) {
            const drivers = await getDrivers();
            const driverData = drivers.find(d => d.assignedVehicleId === vehicleId);
            setDriver(driverData || null);
        }
        setLoading(false);
    }
    fetchData();
  }, [vehicleId]);

  if (loading) {
    return <VehicleDetailsSkeleton />;
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Vehicle Not Found" />
        <main className="flex-1 p-6">
          <p>The vehicle you are looking for does not exist.</p>
        </main>
      </div>
    );
  }

  const logs = vehicle.maintenanceLogs || [];
  const totalKmDriven = logs.reduce((total, log) => {
    return total + (log.closingKm - log.openingKm);
  }, 0);

  const totalFuelLiters = logs.reduce((total, log) => total + (log.fuelLiters || 0), 0);
  const totalFuelCost = logs.reduce((total, log) => total + (log.fuelCost || 0), 0);
  const totalMaintenanceCost = logs.reduce((total, log) => total + (log.maintenanceCost || 0), 0);
  const averageMileage = totalFuelLiters > 0 ? (totalKmDriven / totalFuelLiters) : 0;

  const monthlyData = logs.reduce((acc, log) => {
    const month = format(parseISO(log.date), 'MMM yyyy');
    if (!acc[month]) {
      acc[month] = { month, distance: 0, fuel: 0, maintenance: 0 };
    }
    acc[month].distance += log.closingKm - log.openingKm;
    acc[month].fuel += log.fuelLiters || 0;
    acc[month].maintenance += (log.maintenanceCost || 0) + (log.fuelCost || 0)
    return acc;
  }, {} as Record<string, { month: string; distance: number; fuel: number, maintenance: number }>);

  const chartData = Object.values(monthlyData).reverse();
  const chartConfig = {
    distance: {
      label: 'Distance (km)',
      color: 'hsl(var(--chart-1))',
    },
    fuel: {
      label: 'Fuel (L)',
      color: 'hsl(var(--chart-2))',
    },
     maintenance: {
      label: 'Cost (₹)',
      color: 'hsl(var(--chart-3))',
    }
  } as const;


  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`${vehicle.model} Dashboard`}
        description={`Analytics and details for ${vehicle.licensePlate}`}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
                    <Route className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalKmDriven.toLocaleString()} km</div>
                    <p className="text-xs text-muted-foreground">across all logs</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Fuel Used</CardTitle>
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalFuelLiters.toLocaleString()} L</div>
                    <p className="text-xs text-muted-foreground">Cost: ₹{totalFuelCost.toLocaleString()}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Maintenance</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalMaintenanceCost.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Other repairs & services</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Mileage</CardTitle>
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{averageMileage.toFixed(2)} km/L</div>
                     <p className="text-xs text-muted-foreground">Overall average</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Assigned Driver</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {driver ? (
                        <Link href={`/drivers/${driver.id}/insights`} className="text-primary hover:underline">
                            <div className="text-2xl font-bold">{driver.name}</div>
                            <p className="text-xs text-muted-foreground">View Insights</p>
                        </Link>
                    ) : (
                        <div className="text-xl font-bold text-muted-foreground">N/A</div>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Performance</CardTitle>
                        <CardDescription>Distance, fuel, and cost overview per month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {chartData.length > 0 ? (
                             <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <BarChart data={chartData} accessibilityLayer>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" />
                                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Bar dataKey="distance" name="Distance" fill="hsl(var(--chart-1))" radius={4} yAxisId="left" />
                                <Bar dataKey="fuel" name="Fuel" fill="hsl(var(--chart-2))" radius={4} yAxisId="right" />
                                <Bar dataKey="maintenance" name="Cost" fill="hsl(var(--chart-3))" radius={4} yAxisId="right" />
                                </BarChart>
                            </ChartContainer>
                         ) : (
                            <div className="text-center text-muted-foreground py-12">No data available for chart.</div>
                         )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Image
                            src={vehicle.imageUrl}
                            alt={vehicle.model}
                            width={400}
                            height={300}
                            className="rounded-lg object-cover aspect-[4/3] w-full"
                            data-ai-hint="school bus"
                        />
                        <div className="flex items-center gap-3">
                            <Truck className="w-5 h-5 text-muted-foreground" />
                            <span>{vehicle.model}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Gauge className="w-5 h-5 text-muted-foreground" />
                            <Badge variant="secondary">{vehicle.licensePlate}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <span>{vehicle.isAvailable ? 'Available' : 'Currently in use'}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Certificate Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Insurance</span>
                            <Badge variant={differenceInDays(parseISO(vehicle.insuranceExpiry), new Date()) < 30 ? 'destructive' : 'default'}>
                                Expires {new Date(vehicle.insuranceExpiry).toLocaleDateString()}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Fitness</span>
                            <Badge variant={differenceInDays(parseISO(vehicle.fitnessCertificateExpiry), new Date()) < 30 ? 'destructive' : 'default'}>
                                Expires {new Date(vehicle.fitnessCertificateExpiry).toLocaleDateString()}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Pollution (PUC)</span>
                            <Badge variant={differenceInDays(parseISO(vehicle.pollutionCertificateExpiry), new Date()) < 30 ? 'destructive' : 'default'}>
                                Expires {new Date(vehicle.pollutionCertificateExpiry).toLocaleDateString()}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
         <Card>
            <CardHeader>
                <CardTitle>Daily Activity Log</CardTitle>
                <CardDescription>Breakdown of daily mileage and expenses for this vehicle.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Opening KM</TableHead>
                            <TableHead>Closing KM</TableHead>
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
                                    <TableCell>{log.openingKm.toLocaleString()}</TableCell>
                                    <TableCell>{log.closingKm.toLocaleString()}</TableCell>
                                    <TableCell className="font-medium">{(log.closingKm - log.openingKm).toLocaleString()} km</TableCell>
                                    <TableCell>{log.fuelLiters?.toLocaleString() || 'N/A'}</TableCell>
                                    <TableCell>₹{log.fuelCost?.toLocaleString() || 'N/A'}</TableCell>
                                    <TableCell>₹{log.maintenanceCost?.toLocaleString() || 'N/A'}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{log.notes || 'N/A'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                    No activity logs found for this vehicle.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}

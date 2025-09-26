
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import type { Vehicle, Driver } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, parseISO, format } from 'date-fns';
import { PlusCircle, Eye, Route, Fuel, IndianRupee, Wrench } from 'lucide-react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getVehicles, getDrivers } from '@/lib/firebase/utils';
import { Skeleton } from '@/components/ui/skeleton';

function getExpiryBadgeVariant(dateString: string) {
  if (!dateString) return 'outline';
  const daysUntilExpiry = differenceInDays(parseISO(dateString), new Date());
  if (daysUntilExpiry < 0) return 'destructive';
  if (daysUntilExpiry <= 30) return 'secondary';
  return 'outline';
}

function VehiclesPageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Manage Vehicles"
        description="View and manage all vehicles in the fleet."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Monthly Distance</CardTitle>
              <CardDescription>Total distance driven across all vehicles per month.</CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fleet Monthly Fuel Usage</CardTitle>
              <CardDescription>Total fuel consumed across all vehicles per month.</CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Vehicles</CardTitle>
            <Skeleton className="h-10 w-32" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Chassis No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead>Certificates</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium flex items-center gap-3">
                      <Skeleton className="h-12 w-16 rounded-md" />
                      <div>
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-20 mt-1" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                    <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        const [vehiclesData, driversData] = await Promise.all([getVehicles(), getDrivers()]);
        setVehicles(vehiclesData);
        setDrivers(driversData);
        setLoading(false);
    }
    fetchData();
  }, []);

  const allLogs = vehicles.flatMap(v => v.maintenanceLogs || []);
  const totalFleetKm = allLogs.reduce((total, log) => total + (log.closingKm - log.openingKm), 0);
  const totalFleetFuel = allLogs.reduce((total, log) => total + (log.fuelLiters || 0), 0);
  const totalFuelCost = allLogs.reduce((total, log) => total + (log.fuelCost || 0), 0);
  const totalMaintenanceCost = allLogs.reduce((total, log) => total + (log.maintenanceCost || 0), 0);
  const totalFleetCost = totalFuelCost + totalMaintenanceCost;


  const monthlyData = allLogs.reduce((acc, log) => {
    const month = format(parseISO(log.date), 'MMM yyyy');
    if (!acc[month]) {
      acc[month] = { month, distance: 0, fuel: 0 };
    }
    acc[month].distance += log.closingKm - log.openingKm;
    acc[month].fuel += log.fuelLiters || 0;
    return acc;
  }, {} as Record<string, { month: string; distance: number; fuel: number }>);

  const chartData = Object.values(monthlyData).reverse();
  const distanceChartConfig = {
    distance: {
      label: 'Distance (km)',
      color: 'hsl(var(--chart-1))',
    },
  } as const;

  const fuelChartConfig = {
    fuel: {
      label: 'Fuel (L)',
      color: 'hsl(var(--chart-2))',
    },
  } as const;
  
  if (loading) {
    return <VehiclesPageSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Manage Vehicles"
        description="View and manage all vehicles in the fleet."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Fleet Distance</CardTitle>
                    <Route className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalFleetKm.toLocaleString()} km</div>
                    <p className="text-xs text-muted-foreground">across all vehicles</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Fleet Fuel</CardTitle>
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalFleetFuel.toLocaleString()} L</div>
                    <p className="text-xs text-muted-foreground">Fuel Cost: ₹{totalFuelCost.toLocaleString()}</p>
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
                    <CardTitle className="text-sm font-medium">Total Fleet Cost</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalFleetCost.toLocaleString()}</div>
                     <p className="text-xs text-muted-foreground">Total fuel + maintenance</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Fleet Monthly Distance</CardTitle>
                    <CardDescription>Total distance driven across all vehicles per month.</CardDescription>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <ChartContainer config={distanceChartConfig} className="h-[300px] w-full">
                            <BarChart data={chartData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar dataKey="distance" name="Distance" fill="var(--color-distance)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="text-center text-muted-foreground py-12">No data available for chart.</div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Fleet Monthly Fuel Usage</CardTitle>
                    <CardDescription>Total fuel consumed across all vehicles per month.</CardDescription>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <ChartContainer config={fuelChartConfig} className="h-[300px] w-full">
                            <BarChart data={chartData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar dataKey="fuel" name="Fuel" fill="var(--color-fuel)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="text-center text-muted-foreground py-12">No data available for chart.</div>
                    )}
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Vehicles</CardTitle>
            <Button asChild>
                <Link href="/vehicles/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Link>
              </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Chassis No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead>Certificates</TableHead>
                   <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => {
                  const driver = drivers.find(d => d.assignedVehicleId === vehicle.id);
                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium flex items-center gap-3">
                        <Image
                          src={vehicle.imageUrl}
                          alt={vehicle.model}
                          width={64}
                          height={48}
                          className="rounded-md object-cover aspect-[4/3]"
                          data-ai-hint="school bus"
                        />
                        <div>
                            <p>{vehicle.model}</p>
                            <Badge variant="outline">{vehicle.licensePlate}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{vehicle.chassisNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        {vehicle.isAvailable ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Available</Badge>
                        ) : (
                          <Badge variant="secondary">In Use</Badge>
                        )}
                      </TableCell>
                      <TableCell>{driver ? driver.name : 'N/A'}</TableCell>
                      <TableCell className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-xs w-20">Insurance:</span>
                            <Badge variant={getExpiryBadgeVariant(vehicle.insuranceExpiry)}>
                                {vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toLocaleDateString() : 'N/A'}
                            </Badge>
                        </div>
                         <div className="flex items-center gap-2">
                            <span className="font-medium text-xs w-20">Fitness:</span>
                            <Badge variant={getExpiryBadgeVariant(vehicle.fitnessCertificateExpiry)}>
                                {vehicle.fitnessCertificateExpiry ? new Date(vehicle.fitnessCertificateExpiry).toLocaleDateString() : 'N/A'}
                            </Badge>
                        </div>
                         <div className="flex items-center gap-2">
                            <span className="font-medium text-xs w-20">Pollution:</span>
                            <Badge variant={getExpiryBadgeVariant(vehicle.pollutionCertificateExpiry)}>
                                {vehicle.pollutionCertificateExpiry ? new Date(vehicle.pollutionCertificateExpiry).toLocaleDateString() : 'N/A'}
                            </Badge>
                        </div>
                      </TableCell>
                       <TableCell>
                        <Button variant="outline" size="sm" asChild>
                           <Link href={`/vehicles/${vehicle.id}`}>
                             <Eye className="mr-2 h-4 w-4" />
                             View
                           </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

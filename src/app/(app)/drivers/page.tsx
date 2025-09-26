
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import type { Driver, Vehicle } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, parseISO } from 'date-fns';
import { PlusCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { getDrivers, getVehicles } from '@/lib/firebase/utils';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Skeleton } from '@/components/ui/skeleton';

const driverFormSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    contact: z.string().min(10, { message: 'Contact number must be valid.' }),
    licenseNumber: z.string().min(5, { message: 'License number must be valid.' }),
    licenseExpiry: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
});

function getExpiryBadgeVariant(dateString: string) {
  const daysUntilExpiry = differenceInDays(parseISO(dateString), new Date());
  if (daysUntilExpiry < 0) return 'destructive';
  if (daysUntilExpiry <= 30) return 'secondary';
  return 'outline';
}

function DriversPageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Manage Drivers"
        description="View and manage all drivers in the system."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Drivers</CardTitle>
            <Skeleton className="h-10 w-28" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>License No.</TableHead>
                  <TableHead>License Expiry</TableHead>
                  <TableHead>Assigned Vehicle</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
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

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        const [driversData, vehiclesData] = await Promise.all([getDrivers(), getVehicles()]);
        setDrivers(driversData);
        setVehicles(vehiclesData);
        setLoading(false);
    }
    fetchData();
  }, []);

  const form = useForm<z.infer<typeof driverFormSchema>>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
        name: '',
        contact: '',
        licenseNumber: '',
        licenseExpiry: '',
    },
  });

  async function onSubmit(values: z.infer<typeof driverFormSchema>) {
    try {
        const newDriverData = {
            name: values.name,
            contact: values.contact,
            licenseNumber: values.licenseNumber,
            licenseExpiry: values.licenseExpiry,
            avatarUrl: `https://picsum.photos/seed/driver${drivers.length + 1}/100/100`,
            currentLocation: 'School Campus',
            availability: 'Mon-Fri, 7am-4pm',
        };

        const docRef = await addDoc(collection(db, "drivers"), newDriverData);

        setDrivers(prev => [...prev, { id: docRef.id, ...newDriverData }]);
        toast({
        title: 'Driver Added',
        description: `${values.name} has been added to the system.`,
        });
        setIsDialogOpen(false);
        form.reset();
    } catch (error) {
        console.error("Error adding driver: ", error);
        toast({
            title: 'Error',
            description: 'Failed to add driver. Please try again.',
            variant: 'destructive'
        });
    }
  }
  
  if (loading) {
    return <DriversPageSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Manage Drivers"
        description="View and manage all drivers in the system."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Drivers</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Driver
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Driver</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new driver to add them to the system.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="contact"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Contact Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="+1-202-555-0181" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="licenseNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>License Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="DL123456789" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="licenseExpiry"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>License Expiry Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Save Driver</Button>
                        </DialogFooter>
                    </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>License No.</TableHead>
                  <TableHead>License Expiry</TableHead>
                  <TableHead>Assigned Vehicle</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => {
                  const vehicle = vehicles.find(v => v.id === driver.assignedVehicleId);
                  const expiryBadgeVariant = getExpiryBadgeVariant(driver.licenseExpiry);
                  return (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={driver.avatarUrl} alt={driver.name} data-ai-hint="person portrait" />
                          <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p>{driver.name}</p>
                            <p className="text-xs text-muted-foreground">{driver.currentLocation}</p>
                        </div>
                      </TableCell>
                       <TableCell>{driver.contact}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{driver.licenseNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={expiryBadgeVariant}>
                          {new Date(driver.licenseExpiry).toLocaleDateString()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vehicle ? (
                          <Badge>{vehicle.model} ({vehicle.licensePlate})</Badge>
                        ) : (
                          <Badge variant="outline">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                           <Link href={`/drivers/${driver.id}/insights`}>
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

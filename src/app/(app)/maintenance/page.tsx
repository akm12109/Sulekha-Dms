
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { PageHeader } from '@/components/page-header';
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import type { Driver, Vehicle } from "@/lib/types";
import { getDrivers, getVehicles } from "@/lib/firebase/utils";
import { Skeleton } from "@/components/ui/skeleton";

const maintenanceFormSchema = z.object({
  openingKm: z.coerce.number().min(0, "Opening mileage must be a positive number."),
  closingKm: z.coerce.number().min(0, "Closing mileage must be a positive number.").optional(),
  fuelLiters: z.coerce.number().min(0, "Fuel must be a positive number.").optional(),
  fuelCost: z.coerce.number().min(0, "Fuel cost must be a positive number.").optional(),
  maintenanceCost: z.coerce.number().min(0, "Maintenance cost must be a positive number.").optional(),
  notes: z.string().optional(),
}).refine(data => !data.closingKm || data.closingKm >= data.openingKm, {
    message: "Closing mileage must be greater than or equal to opening mileage.",
    path: ["closingKm"],
});

function MaintenanceSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Daily Maintenance Log"
        description="Loading your vehicle details..."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Log for Today</CardTitle>
            <CardDescription>Enter the kilometer readings and any fuel or maintenance expenses for your assigned vehicle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <fieldset className="border p-4 rounded-md">
              <legend className="text-lg font-medium px-1">Expense Log</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </fieldset>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-10 w-24" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function MaintenancePage() {
  const { toast } = useToast();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  
  const form = useForm<z.infer<typeof maintenanceFormSchema>>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      openingKm: 0,
      notes: "",
    },
  });

  useEffect(() => {
    async function fetchData() {
        const loggedInDriverId = 'D002'; // Mock logged-in driver
        const driverData = await getDrivers().then(drivers => drivers.find(d => d.id === loggedInDriverId));
        setDriver(driverData || null);
        if (driverData?.assignedVehicleId) {
            const vehicleData = await getVehicles().then(v => v.find(v => v.id === driverData.assignedVehicleId));
            setVehicle(vehicleData || null);
            if (vehicleData) {
              const lastLog = vehicleData.maintenanceLogs && vehicleData.maintenanceLogs.length > 0
                  ? vehicleData.maintenanceLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                  : null;

              form.reset({
                  openingKm: lastLog?.closingKm || vehicleData.openingKmToday || 0,
                  closingKm: vehicleData.closingKmToday || undefined,
                  notes: "",
              });
            }
        }
        setLoading(false);
    }
    fetchData();
  }, [form]);
 
  function onSubmit(values: z.infer<typeof maintenanceFormSchema>) {
    console.log(values);
    // In a real app, this would be saved to the vehicle's maintenanceLogs in Firestore
    toast({
      title: "Log Submitted",
      description: `Your maintenance and fuel log has been saved.`,
    })
  }

  if (loading) {
    return <MaintenanceSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Daily Maintenance Log"
        description={`Log mileage and fuel for ${vehicle?.model || 'your vehicle'}.`}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {!vehicle ? (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>No Vehicle Assigned</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>You do not have a vehicle assigned. Please contact an administrator.</p>
                </CardContent>
            </Card>
        ) : (
            <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Log for Today</CardTitle>
                <CardDescription>Enter the kilometer readings and any fuel or maintenance expenses for your assigned vehicle.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="openingKm"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Opening Mileage (km)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 50250" {...field} />
                            </FormControl>
                            <FormDescription>
                            The mileage at the start of your shift.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="closingKm"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Closing Mileage (km)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Enter at end of shift" {...field} />
                            </FormControl>
                            <FormDescription>
                            The mileage at the end of your shift.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                    
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-medium px-1">Expense Log</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <FormField
                            control={form.control}
                            name="fuelLiters"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fuel Added (Liters)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="e.g., 25" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fuelCost"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Total Fuel Cost (₹)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="e.g., 2500" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="maintenanceCost"
                            render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Other Maintenance Cost (₹)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="e.g., 500 for oil change" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>
                    </fieldset>
                    <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="e.g., 'Replaced wiper blades', 'Tire pressure check'"
                            {...field}
                            />
                        </FormControl>
                        <FormDescription>
                            Add any notes about maintenance or issues.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <Button type="submit">Save Log</Button>
                </form>
                </Form>
            </CardContent>
            </Card>
        )}
      </main>
    </div>
  );
}

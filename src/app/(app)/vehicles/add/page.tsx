
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const vehicleFormSchema = z.object({
  model: z.string().min(2, { message: 'Model must be at least 2 characters.' }),
  licensePlate: z.string().min(3, { message: 'License plate must be valid.' }),
  chassisNumber: z.string().optional(),
  vehiclePhoto: z
    .any()
    .refine((files) => files?.length == 1, 'Vehicle photo is required.'),
  insuranceExpiry: z.string().optional(),
  fitnessCertificateExpiry: z.string().optional(),
  pollutionCertificateExpiry: z.string().optional(),
  insurancePhoto: z.any().optional(),
  fitnessCertificatePhoto: z.any().optional(),
  pollutionCertificatePhoto: z.any().optional(),
});

export default function AddVehiclePage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof vehicleFormSchema>>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      model: '',
      licensePlate: '',
      chassisNumber: '',
      vehiclePhoto: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof vehicleFormSchema>) {
    // In a real app, you would upload files to a storage service
    // and save the vehicle data to a database.
    console.log(values);
    
    toast({
      title: 'Vehicle Added Successfully',
      description: `${values.model} (${values.licensePlate}) has been registered.`,
    });
    
    router.push('/vehicles');
  }

  const vehiclePhotoRef = form.register("vehiclePhoto");
  const insurancePhotoRef = form.register("insurancePhoto");
  const fitnessPhotoRef = form.register("fitnessCertificatePhoto");
  const pollutionPhotoRef = form.register("pollutionCertificatePhoto");


  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Add New Vehicle"
        description="Fill in the details to register a new vehicle in the fleet."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>
              Fields marked with an asterisk (*) are mandatory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Model *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Ford Transit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate No. *</FormLabel>
                        <FormControl>
                          <Input placeholder="SCHOOL1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="chassisNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chassis No.</FormLabel>
                        <FormControl>
                          <Input placeholder="FTB123456XYZ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="vehiclePhoto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Photo *</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" {...vehiclePhotoRef} />
                      </FormControl>
                      <FormDescription>Upload a clear photo of the vehicle.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <fieldset className="border p-4 rounded-md">
                  <legend className="text-lg font-medium px-1">Certificates</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 pt-4">
                    {/* Insurance */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="insuranceExpiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Insurance Expiry</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="insurancePhoto"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Insurance Certificate Photo</FormLabel>
                                <FormControl>
                                    <Input type="file" accept="image/*,application/pdf" {...insurancePhotoRef} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                       />
                    </div>
                    
                    {/* Fitness */}
                     <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fitnessCertificateExpiry"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Fitness Certificate Expiry</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="fitnessCertificatePhoto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fitness Certificate Photo</FormLabel>
                                    <FormControl>
                                        <Input type="file" accept="image/*,application/pdf" {...fitnessPhotoRef} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Pollution */}
                     <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="pollutionCertificateExpiry"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Pollution Certificate Expiry</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pollutionCertificatePhoto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pollution Certificate Photo</FormLabel>
                                    <FormControl>
                                        <Input type="file" accept="image/*,application/pdf" {...pollutionPhotoRef} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                  </div>
                </fieldset>
                
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit">Save Vehicle</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

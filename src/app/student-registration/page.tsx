

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { differenceInYears } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { countries } from '@/lib/countries';
import { indianStates } from '@/lib/indian-states';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getApplicationByUid } from '@/lib/firebase/utils';
import { LoadingSkeleton } from '@/components/loading-skeleton';


const step1Schema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  gender: z.enum(["male", "female", "other"], { required_error: "Please select a gender." }),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date of birth' }),
  age: z.coerce.number().min(3, "Age must be at least 3."),
  bloodGroup: z.string().optional(),
  nationality: z.string().min(2, 'Nationality is required.'),
  aadharNumber: z.string().optional(),
});

const step2Schema = z.object({
  fatherName: z.string().min(2, "Father's name is required."),
  fatherOccupation: z.string().optional(),
  fatherMobile: z.string().min(10, "A valid mobile number is required."),
  fatherEmail: z.string().email("Invalid email address.").optional().or(z.literal('')),
  motherName: z.string().min(2, "Mother's name is required."),
  motherOccupation: z.string().optional(),
  motherMobile: z.string().min(10, "A valid mobile number is required."),
  motherEmail: z.string().email("Invalid email address.").optional().or(z.literal('')),
  guardianName: z.string().optional(),
  guardianRelationship: z.string().optional(),
  guardianContact: z.string().optional(),
});

const step3Schema = z.object({
    residentialAddress: z.string().min(10, "Address is required."),
    permanentAddress: z.string().optional(),
    state: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    pincode: z.string().optional(),
    emergencyContact: z.string().min(10, "Emergency contact is required."),
});

const step4Schema = z.object({
    medicalConditions: z.string().optional(),
    disability: z.string().optional(),
    doctorName: z.string().optional(),
    vaccinationStatus: z.string().optional(),
});

const step5Schema = z.object({
    birthCertificateUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
    transferCertificateUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
    aadharCardUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
    passportPhotoUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
    previousReportCardUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});


const formSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema).merge(step5Schema);


export default function StudentRegistrationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [districts, setDistricts] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        nationality: 'India',
    },
  });

  useEffect(() => {
    if (user) {
        getApplicationByUid(user.uid).then(app => {
            if(app) {
                setApplicationId(app.id);
                // Pre-fill form with existing data if any
                form.reset({
                    fullName: app.name,
                    ...app
                });
            }
        });
    }
  }, [user, form]);

  const watchedDob = form.watch('dob');
  const watchedState = form.watch('state');

  useEffect(() => {
    if (watchedDob) {
      try {
        const birthDate = new Date(watchedDob);
        const age = differenceInYears(new Date(), birthDate);
        if (!isNaN(age) && age >= 0) {
          form.setValue('age', age, { shouldValidate: true });
        } else {
          form.setValue('age', 0);
        }
      } catch (e) {
        form.setValue('age', 0);
      }
    }
  }, [watchedDob, form]);

  useEffect(() => {
    if (watchedState) {
        const stateData = indianStates.find(s => s.name === watchedState);
        setDistricts(stateData ? stateData.districts : []);
        form.setValue('district', '');
    } else {
        setDistricts([]);
    }
  }, [watchedState, form]);

  const steps = [
    { id: 'Step 1', name: 'Student Information', fields: ['fullName', 'gender', 'dob', 'age', 'bloodGroup', 'nationality', 'aadharNumber'] },
    { id: 'Step 2', name: 'Parent/Guardian Details', fields: ['fatherName', 'fatherMobile', 'fatherEmail', 'motherName', 'motherMobile', 'motherEmail', 'guardianName', 'guardianRelationship', 'guardianContact'] },
    { id: 'Step 3', name: 'Contact Details', fields: ['residentialAddress', 'permanentAddress', 'state', 'district', 'city', 'pincode', 'emergencyContact'] },
    { id: 'Step 4', name: 'Health Information', fields: ['medicalConditions', 'disability', 'doctorName', 'vaccinationStatus'] },
    { id: 'Step 5', name: 'Documents Links', fields: ['birthCertificateUrl', 'transferCertificateUrl', 'aadharCardUrl', 'passportPhotoUrl', 'previousReportCardUrl'] },
  ];

  type FieldName = keyof z.infer<typeof formSchema>;

  const next = async () => {
    const fields = steps[currentStep].fields as FieldName[];
    const output = await form.trigger(fields, { shouldFocus: true });

    if (!output) return;

    if (currentStep < steps.length - 1) {
        setCurrentStep(step => step + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!applicationId) {
        toast({ title: "Error", description: "Application not found. Please log in again.", variant: "destructive"});
        return;
    }

    setLoading(true);

    try {
      const applicationRef = doc(db, "applications", applicationId);
      await updateDoc(applicationRef, {
        ...values,
        status: 'pending', // Update status to pending for admin review
      });
      
      toast({
        title: 'Profile Submitted',
        description: 'The application has been sent for review. You will be notified of the status.',
      });
      router.push('/under-review');

    } catch (error) {
      console.error("Error submitting student registration:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting the registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  if(authLoading || !applicationId) {
    return <LoadingSkeleton message="Loading your profile..." />
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-3xl">
        <Card className="shadow-2xl backdrop-blur-sm bg-card/80">
          <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="font-headline text-3xl pt-4">
              Student Registration Form
            </CardTitle>
            <CardDescription>
              Please complete your profile. Fields with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Steps Indicator */}
            <div className="flex justify-center items-center mb-8">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div className={`flex items-center justify-center h-8 w-8 rounded-full ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {index + 1}
                        </div>
                         {index < steps.length - 1 && <div className={`w-12 h-1 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`}></div>}
                    </div>
                ))}
            </div>


            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Step 1: Student Information */}
                <div className={currentStep === 0 ? 'block' : 'hidden'}>
                  <h3 className="text-xl font-semibold mb-6 text-center">{steps[0].name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl><Input placeholder="Student's full name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="dob" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="age" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 5" {...field} readOnly className="bg-muted/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="bloodGroup" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Group</FormLabel>
                        <FormControl><Input placeholder="e.g., B+" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nationality" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {countries.map(country => (
                                    <SelectItem key={country} value={country}>{country}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="aadharNumber" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Aadhar Number</FormLabel>
                        <FormControl><Input placeholder="xxxx-xxxx-xxxx" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Step 2: Parent/Guardian Details */}
                <div className={currentStep === 1 ? 'block' : 'hidden'}>
                  <h3 className="text-xl font-semibold mb-6 text-center">{steps[1].name}</h3>
                  <div className="space-y-8">
                     <div className="space-y-4 border-b pb-6">
                        <h4 className="font-medium text-lg">Father's Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="fatherName" render={({ field }) => (
                                <FormItem><FormLabel>Father's Name *</FormLabel><FormControl><Input placeholder="Father's full name" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="fatherOccupation" render={({ field }) => (
                                <FormItem><FormLabel>Occupation</FormLabel><FormControl><Input placeholder="e.g., Engineer" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="fatherMobile" render={({ field }) => (
                                <FormItem><FormLabel>Mobile Number *</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="fatherEmail" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="father@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                     </div>
                     <div className="space-y-4 border-b pb-6">
                        <h4 className="font-medium text-lg">Mother's Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField control={form.control} name="motherName" render={({ field }) => (
                                <FormItem><FormLabel>Mother's Name *</FormLabel><FormControl><Input placeholder="Mother's full name" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="motherOccupation" render={({ field }) => (
                                <FormItem><FormLabel>Occupation</FormLabel><FormControl><Input placeholder="e.g., Doctor" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="motherMobile" render={({ field }) => (
                                <FormItem><FormLabel>Mobile Number *</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="motherEmail" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="mother@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h4 className="font-medium text-lg">Guardian's Details (if different from parents)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField control={form.control} name="guardianName" render={({ field }) => (
                                <FormItem><FormLabel>Guardian's Name</FormLabel><FormControl><Input placeholder="Guardian's name" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="guardianRelationship" render={({ field }) => (
                                <FormItem><FormLabel>Relationship</FormLabel><FormControl><Input placeholder="e.g., Uncle" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="guardianContact" render={({ field }) => (
                                <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                     </div>
                  </div>
                </div>

                {/* Step 3: Contact Details */}
                <div className={currentStep === 2 ? 'block' : 'hidden'}>
                  <h3 className="text-xl font-semibold mb-6 text-center">{steps[2].name}</h3>
                  <div className="space-y-6">
                     <FormField control={form.control} name="residentialAddress" render={({ field }) => (
                        <FormItem><FormLabel>Residential Address *</FormLabel><FormControl><Textarea placeholder="Complete residential address" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                      <FormField control={form.control} name="permanentAddress" render={({ field }) => (
                        <FormItem><FormLabel>Permanent Address (if different)</FormLabel><FormControl><Textarea placeholder="Complete permanent address" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="state" render={({ field }) => (
                            <FormItem>
                                <FormLabel>State</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {indianStates.map(state => (
                                            <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="district" render={({ field }) => (
                            <FormItem>
                                <FormLabel>District</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!watchedState}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {districts.map(district => (
                                            <SelectItem key={district} value={district}>{district}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Springfield" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="pincode" render={({ field }) => (
                            <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="e.g. 62704" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                        <FormItem><FormLabel>Emergency Contact Number *</FormLabel><FormControl><Input placeholder="A number for emergencies" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                  </div>
                </div>

                {/* Step 4: Health Information */}
                <div className={currentStep === 3 ? 'block' : 'hidden'}>
                    <h3 className="text-xl font-semibold mb-6 text-center">{steps[3].name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <FormField control={form.control} name="medicalConditions" render={({ field }) => (
                            <FormItem><FormLabel>Medical Conditions</FormLabel><FormControl><Input placeholder="e.g., Asthma, Allergies" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                          <FormField control={form.control} name="disability" render={({ field }) => (
                            <FormItem><FormLabel>Disability (if any)</FormLabel><FormControl><Input placeholder="Specify if applicable" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                          <FormField control={form.control} name="doctorName" render={({ field }) => (
                            <FormItem><FormLabel>Doctor's Name & Contact</FormLabel><FormControl><Input placeholder="Dr. Smith, 555-1234" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="vaccinationStatus" render={({ field }) => (
                            <FormItem><FormLabel>Vaccination Status</FormLabel><FormControl><Input placeholder="e.g., Fully Vaccinated" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                    </div>
                </div>


                {/* Step 5: Documents Links */}
                <div className={currentStep === 4 ? 'block' : 'hidden'}>
                  <h3 className="text-xl font-semibold mb-6 text-center">{steps[4].name}</h3>
                   <p className="text-sm text-center text-muted-foreground mb-6">Please provide public links (e.g., from Google Drive, Dropbox) to your documents.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField control={form.control} name="passportPhotoUrl" render={({ field }) => (
                        <FormItem><FormLabel>Passport Size Photograph URL</FormLabel><FormControl><Input placeholder="https://your-link.com/photo.jpg" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="birthCertificateUrl" render={({ field }) => (
                        <FormItem><FormLabel>Birth Certificate URL</FormLabel><FormControl><Input placeholder="https://your-link.com/birth-cert.pdf" {...field} /></FormControl><FormMessage /></FormMessage>
                    )} />
                     <FormField control={form.control} name="aadharCardUrl" render={({ field }) => (
                        <FormItem><FormLabel>Aadhar Card URL</FormLabel><FormControl><Input placeholder="https://your-link.com/aadhar.pdf" {...field} /></FormControl><FormMessage /></FormMessage>
                    )} />
                    <FormField control={form.control} name="transferCertificateUrl" render={({ field }) => (
                        <FormItem><FormLabel>Transfer Certificate URL</FormLabel><FormControl><Input placeholder="https://your-link.com/tc.pdf" {...field} /></FormControl><FormMessage /></FormMessage>
                    )} />
                    <FormField control={form.control} name="previousReportCardUrl" render={({ field }) => (
                        <FormItem><FormLabel>Previous Report Card URL</FormLabel><FormControl><Input placeholder="https://your-link.com/report.pdf" {...field} /></FormControl><FormMessage /></FormMessage>
                    )} />
                  </div>
                </div>


                <div className="mt-8 pt-5">
                    <div className="flex justify-between">
                        <Button type="button" onClick={prev} disabled={currentStep === 0 || loading} variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                        </Button>
                        
                        {currentStep === steps.length - 1 ? (
                             <Button type="submit" disabled={loading}>
                                {loading ? (<><Loader2 className="animate-spin mr-2"/> Submitting...</>) : 'Submit Registration'}
                             </Button>
                        ) : (
                            <Button type="button" onClick={next}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
              </form>
            </Form>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Incorrect page?{' '}
              <Link href="/" className="font-semibold text-primary hover:underline">
                Go back to Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

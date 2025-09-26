

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
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getApplicationByUid } from '@/lib/firebase/utils';
import { LoadingSkeleton } from '@/components/loading-skeleton';


const step1Schema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  gender: z.enum(["male", "female", "other"], { required_error: "Please select a gender." }),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date of birth' }),
  age: z.coerce.number().min(18, "Must be at least 18 years old."),
  bloodGroup: z.string().optional(),
  nationality: z.string().min(2, 'Nationality is required.'),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  aadharNumber: z.string().optional(),
});

const step2Schema = z.object({
  mobileNumber: z.string().min(10, "A valid mobile number is required."),
  alternateNumber: z.string().optional(),
  emailAddress: z.string().email("Invalid email address."),
  residentialAddress: z.string().min(10, "Address is required."),
  permanentAddress: z.string().optional(),
  emergencyContact: z.string().min(10, "Emergency contact is required."),
});

const step3Schema = z.object({
    highestQualification: z.string().min(2, "Highest qualification is required."),
    otherDegrees: z.string().optional(),
    specialization: z.string().min(2, "Specialization is required."),
    yearOfPassing: z.coerce.number().min(1950).max(new Date().getFullYear()),
    university: z.string().min(2, "University/Board name is required."),
    certifications: z.string().optional(),
});

const step4Schema = z.object({
    subjects: z.string().min(2, "Please list interested subjects."),
    preferredClasses: z.string().optional(),
    totalExperience: z.coerce.number().min(0, "Experience cannot be negative."),
    previousSchools: z.string().optional(),
});

const step5Schema = z.object({
    resumeUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
    photographUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
    idProofUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
    degreeCertificatesUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
    experienceCertificatesUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});


const formSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema).merge(step5Schema);


export default function TeacherRegistrationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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
                    emailAddress: app.email,
                    ...app
                });
            }
        });
    }
  }, [user, form]);

  const watchedDob = form.watch('dob');

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

  const steps = [
    { id: 'Step 1', name: 'Personal Information', fields: ['fullName', 'gender', 'dob', 'age', 'bloodGroup', 'nationality', 'maritalStatus', 'aadharNumber'] },
    { id: 'Step 2', name: 'Contact Information', fields: ['mobileNumber', 'alternateNumber', 'emailAddress', 'residentialAddress', 'permanentAddress', 'emergencyContact'] },
    { id: 'Step 3', name: 'Education & Qualification', fields: ['highestQualification', 'otherDegrees', 'specialization', 'yearOfPassing', 'university', 'certifications'] },
    { id: 'Step 4', name: 'Teaching Experience', fields: ['subjects', 'preferredClasses', 'totalExperience', 'previousSchools'] },
    { id: 'Step 5', name: 'Documents Links', fields: ['resumeUrl', 'photographUrl', 'idProofUrl', 'degreeCertificatesUrl', 'experienceCertificatesUrl'] },
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
        description: 'Your application has been sent for review. You will be notified of the status.',
      });
      router.push('/under-review');

    } catch (error) {
      console.error("Error submitting teacher registration:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your profile. Please try again.",
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
              Teacher Registration Form
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
                {/* Step 1: Personal Information */}
                <div className={currentStep === 0 ? 'block' : 'hidden'}>
                  <h3 className="text-xl font-semibold mb-6 text-center">{steps[0].name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
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
                        <FormControl><Input type="number" placeholder="e.g., 30" {...field} readOnly className="bg-muted/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="bloodGroup" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Group</FormLabel>
                        <FormControl><Input placeholder="e.g., O+" {...field} /></FormControl>
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
                     <FormField control={form.control} name="maritalStatus" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marital Status</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married">Married</SelectItem>
                                <SelectItem value="divorced">Divorced</SelectItem>
                                <SelectItem value="widowed">Widowed</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="aadharNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhar Number</FormLabel>
                        <FormControl><Input placeholder="xxxx-xxxx-xxxx" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Step 2: Contact Information */}
                <div className={currentStep === 1 ? 'block' : 'hidden'}>
                  <h3 className="text-xl font-semibold mb-6 text-center">{steps[1].name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                        <FormItem><FormLabel>Mobile Number *</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                      <FormField control={form.control} name="alternateNumber" render={({ field }) => (
                        <FormItem><FormLabel>Alternate Number</FormLabel><FormControl><Input placeholder="Optional contact number" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="emailAddress" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Email Address *</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} readOnly className="bg-muted/50" /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="residentialAddress" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Residential Address *</FormLabel><FormControl><Textarea placeholder="Complete residential address" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                      <FormField control={form.control} name="permanentAddress" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Permanent Address (if different)</FormLabel><FormControl><Textarea placeholder="Complete permanent address" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Emergency Contact Number *</FormLabel><FormControl><Input placeholder="A number for emergencies" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                  </div>
                </div>

                {/* Step 3: Education & Qualification */}
                <div className={currentStep === 2 ? 'block' : 'hidden'}>
                  <h3 className="text-xl font-semibold mb-6 text-center">{steps[2].name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={form.control} name="highestQualification" render={({ field }) => (
                        <FormItem><FormLabel>Highest Qualification *</FormLabel><FormControl><Input placeholder="e.g., M.Ed, PhD in Physics" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                      <FormField control={form.control} name="yearOfPassing" render={({ field }) => (
                        <FormItem><FormLabel>Year of Passing *</FormLabel><FormControl><Input type="number" placeholder="e.g., 2010" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="university" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>University / Board Name *</FormLabel><FormControl><Input placeholder="e.g., University of Delhi" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="specialization" render={({ field }) => (
                        <FormItem><FormLabel>Specialization / Major Subject *</FormLabel><FormControl><Input placeholder="e.g., Mathematics, English Literature" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="otherDegrees" render={({ field }) => (
                        <FormItem><FormLabel>Other Degrees / Diplomas</FormLabel><FormControl><Input placeholder="e.g., B.Sc, Diploma in Arts" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                      <FormField control={form.control} name="certifications" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Certifications (CTET, NET, etc.)</FormLabel><FormControl><Input placeholder="List any relevant certifications" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                  </div>
                </div>

                {/* Step 4: Teaching Experience */}
                <div className={currentStep === 3 ? 'block' : 'hidden'}>
                    <h3 className="text-xl font-semibold mb-6 text-center">{steps[3].name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <FormField control={form.control} name="subjects" render={({ field }) => (
                            <FormItem><FormLabel>Subjects Interested in Teaching *</FormLabel><FormControl><Input placeholder="e.g., Math, Science" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                          <FormField control={form.control} name="preferredClasses" render={({ field }) => (
                            <FormItem><FormLabel>Classes Preferred</FormLabel><FormControl><Input placeholder="e.g., 6th to 8th" {...field} /></FormControl><FormMessage /></FormMessage>
                         )} />
                          <FormField control={form.control} name="totalExperience" render={({ field }) => (
                            <FormItem><FormLabel>Total Teaching Experience (years) *</FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="previousSchools" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Previous Schools Worked At</FormLabel><FormControl><Textarea placeholder="School Name 1 (Duration)&#10;School Name 2 (Duration)" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                    </div>
                </div>


                {/* Step 5: Documents Links */}
                <div className={currentStep === 4 ? 'block' : 'hidden'}>
                  <h3 className="text-xl font-semibold mb-6 text-center">{steps[4].name}</h3>
                   <p className="text-sm text-center text-muted-foreground mb-6">Please provide public links (e.g., from Google Drive, Dropbox) to your documents.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField control={form.control} name="photographUrl" render={({ field }) => (
                        <FormItem><FormLabel>Passport Size Photograph URL</FormLabel><FormControl><Input placeholder="https://your-link.com/photo.jpg" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="resumeUrl" render={({ field }) => (
                        <FormItem><FormLabel>Resume / CV URL</FormLabel><FormControl><Input placeholder="https://your-link.com/resume.pdf" {...field} /></FormControl><FormMessage /></FormMessage>
                    )} />
                     <FormField control={form.control} name="idProofUrl" render={({ field }) => (
                        <FormItem><FormLabel>ID Proof (Aadhar/PAN) URL</FormLabel><FormControl><Input placeholder="https://your-link.com/id.pdf" {...field} /></FormControl><FormMessage /></FormMessage>
                    )} />
                    <FormField control={form.control} name="degreeCertificatesUrl" render={({ field }) => (
                        <FormItem><FormLabel>Degree Certificates URL</FormLabel><FormControl><Input placeholder="https://your-link.com/degrees.pdf" {...field} /></FormControl><FormMessage /></FormMessage>
                    )} />
                    <FormField control={form.control} name="experienceCertificatesUrl" render={({ field }) => (
                        <FormItem><FormLabel>Experience Certificates URL</FormLabel><FormControl><Input placeholder="https://your-link.com/experience.pdf" {...field} /></FormControl><FormMessage /></FormMessage>
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
                                {loading ? (<><Loader2 className="animate-spin mr-2"/> Submitting...</>) : 'Submit Application'}
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

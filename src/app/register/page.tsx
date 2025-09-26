
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['teacher', 'student', 'parent', 'driver'], { required_error: 'You must select a role.' }),
});


export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    
    try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        await updateProfile(user, {
            displayName: values.name,
        });

        // 2. Create application in Firestore with 'profile_incomplete' status
        const applicationData: any = {
            uid: user.uid,
            name: values.name,
            email: values.email,
            role: values.role,
            appliedDate: new Date().toISOString(),
            status: 'profile_incomplete',
        };
        
        await addDoc(collection(db, "applications"), applicationData);
        
        toast({
          title: 'Account Created',
          description: 'Logging you in to complete your profile...',
        });

        // 3. Auto-login the user
        await signInWithEmailAndPassword(auth, values.email, values.password);
        
        // 4. Redirect to the appropriate profile completion page
        const { role } = values;
        if (role === 'driver') router.push('/driver-registration');
        else if (role === 'teacher') router.push('/teacher-registration');
        else if (role === 'student') router.push('/student-registration');
        else {
          // For parent or other roles that don't have a detailed form yet.
          router.push('/under-review');
        }


    } catch (error: any) {
        console.error("Error submitting application: ", error);
        let errorMessage = 'An unknown error occurred.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email address is already in use by another account.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        toast({
            title: 'Registration Failed',
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl backdrop-blur-sm bg-card/80">
          <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="font-headline text-3xl pt-4">
              Register an Account
            </CardTitle>
            <CardDescription>
              Create your account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g. John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>I am a... *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="driver">Driver</SelectItem>
                                  <SelectItem value="teacher">Teacher</SelectItem>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="parent">Parent</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                          <>
                          <Loader2 className="animate-spin mr-2"/> Creating Account...
                          </>
                      ) : 'Create Account'}
                  </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/" className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

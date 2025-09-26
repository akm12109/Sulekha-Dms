
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { ArrowRight, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { getApplicationByUid } from '@/lib/firebase/utils';
import type { Application } from '@/lib/types';


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
          // Special case for admin user
          if (user.email === 'admin@sdm.in') {
              toast({
                title: 'Admin Login Successful',
                description: 'Redirecting to the admin dashboard...',
              });
              router.push(`/dashboard?role=admin`);
              return;
          }

          const application: Application | null = await getApplicationByUid(user.uid);
          
          if (!application) {
            throw new Error("Your application data was not found. Please register again or contact support.");
          }

          switch (application.status) {
            case 'approved':
              toast({
                title: 'Login Successful',
                description: 'Redirecting to your dashboard...',
              });
              router.push(`/dashboard?role=${application.role}`);
              break;
            case 'pending':
            case 'rejected':
              router.push('/under-review');
              break;
            case 'profile_incomplete':
               toast({
                title: 'Profile Incomplete',
                description: 'Please complete your profile to continue.',
              });
              const { role } = application;
              if (role === 'driver') router.push('/driver-registration');
              else if (role === 'teacher') router.push('/teacher-registration');
              else if (role === 'student') router.push('/student-registration');
              else {
                // For parents or other roles that might not have a detailed form,
                // or if something goes wrong, send to a safe page.
                router.push('/under-review');
              }
              break;
            default:
              throw new Error("Unknown application status.");
          }

      } else {
         throw new Error("Could not find user data.");
      }
      
    } catch (error: any) {
      console.error(error);
       toast({
        title: 'Login Failed',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl backdrop-blur-sm bg-card/80">
          <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="font-headline text-3xl pt-4">
              Welcome to Sulekha Devi Mission School
            </CardTitle>
            <CardDescription>
              Your all-in-one school management solution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sdm.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Log In
                    <ArrowRight />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <div className="relative w-full">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-sm text-muted-foreground">OR</span>
            </div>
             <Button variant="outline" className="w-full" asChild>
                <Link href="/register">Create a New Account</Link>
             </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

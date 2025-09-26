

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Parent, Route } from '@/lib/types';
import { UserCircle } from 'lucide-react';
import { useRole } from '@/hooks/use-role';
import { getParents, getRoutes } from '@/lib/firebase/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Skeleton } from '@/components/ui/skeleton';

const profileFormSchema = z.object({
  name: z.string().min(2, "Name is required."),
  childName: z.string().min(2, "Child's name is required."),
  nearestStop: z.string().min(1, "You must select a stop."),
});

function ParentProfileSkeleton() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>Update your personal information and select your nearest bus stop to track the vehicle.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  )
}

function ParentProfile() {
  const { toast } = useToast();
  const [parent, setParent] = useState<Parent | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const allStops = Array.from(new Set(routes.flatMap(r => r.stops)));

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      childName: '',
      nearestStop: '',
    },
  });

  useEffect(() => {
    async function fetchData() {
      const loggedInParentId = 'P001'; // Mock logged in parent id
      const [parentsData, routesData] = await Promise.all([getParents(), getRoutes()]);
      const parentData = parentsData.find(p => p.id === loggedInParentId);
      
      setParent(parentData || null);
      setRoutes(routesData);

      if (parentData) {
        form.reset({
          name: parentData.name,
          childName: parentData.childName,
          nearestStop: parentData.nearestStop || '',
        });
      }
      setLoading(false);
    }
    fetchData();
  }, [form]);

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!parent) return;

    const assignedRoute = routes.find(r => r.stops.includes(values.nearestStop));
    
    const updatedParentData = {
      name: values.name,
      childName: values.childName,
      nearestStop: values.nearestStop,
      assignedRouteId: assignedRoute?.id || null,
    };
    
    try {
        const parentRef = doc(db, 'parents', parent.id);
        await updateDoc(parentRef, updatedParentData);
        
        setParent(prev => prev ? { ...prev, ...updatedParentData } : null);
        
        toast({
          title: "Profile Updated",
          description: "Your information and nearest stop have been saved.",
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({
            title: "Error",
            description: "Failed to update profile. Please try again.",
            variant: "destructive"
        });
    }
  }

  if (loading) {
      return <ParentProfileSkeleton />
  }

  if (!parent) {
      return <div>Could not load parent data.</div>
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>Update your personal information and select your nearest bus stop to track the vehicle.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="childName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Billy Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nearestStop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nearest Bus Stop</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your closest stop..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allStops.map(stop => (
                        <SelectItem key={stop} value={stop}>{stop}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save Profile</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default function ProfilePage() {
  const role = useRole();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Profile"
        description="Manage your personal information."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {role === 'parent' ? (
          <ParentProfile />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Profile Page</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your profile information will be available here soon.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

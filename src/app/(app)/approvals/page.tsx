
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Application } from '@/lib/types';
import { Check, X, UserPlus, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getApplications } from '@/lib/firebase/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, updateDoc, addDoc, collection, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

function ApprovalsSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Application Approvals"
        description="Review and manage new user registration requests."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Applications</CardTitle>
            <CardDescription>
              The following users are waiting for approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="space-x-2">
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-9 w-24" />
                    </TableCell>
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

export default function ApprovalsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApplications = async () => {
      const apps = await getApplications();
      setApplications(apps);
      setLoading(false);
    };
    fetchApplications();
  }, []);

  const handleApprove = async (appId: string) => {
    setUpdatingId(appId);
    const approvedApp = applications.find(a => a.id === appId);
    if (!approvedApp) {
      setUpdatingId(null);
      return;
    }

    try {
      // 1. Create the user record in Firestore based on role
      let collectionName = '';
      let userData: any = {};
      
      const appData = approvedApp as any;

      switch(approvedApp.role) {
        case 'driver':
          collectionName = 'drivers';
          userData = {
            uid: approvedApp.uid,
            name: approvedApp.name,
            email: approvedApp.email,
            contact: appData.mobileNumber || 'N/A',
            licenseNumber: appData.drivingLicenseNumber || 'N/A',
            licenseExpiry: appData.licenseExpiryDate || 'N/A',
            avatarUrl: `https://picsum.photos/seed/${approvedApp.name.split(' ')[0]}/100/100`,
            currentLocation: 'School Campus',
            availability: 'Mon-Fri, 7am-4pm',
          };
          break;
        case 'student':
           collectionName = 'students';
           userData = {
                uid: approvedApp.uid,
                name: approvedApp.name,
                email: approvedApp.email,
                fatherName: appData.fatherName || 'N/A',
                motherName: appData.motherName || 'N/A',
                dob: appData.dob || 'N/A',
                class: 'N/A', // Class needs to be assigned later
                rollNo: 'N/A', // Roll no to be assigned later
           }
          break;
        case 'teacher':
           collectionName = 'teachers';
           userData = {
             uid: approvedApp.uid,
             name: approvedApp.name,
             email: approvedApp.email,
             subjects: appData.subjects?.split(',').map((s:string) => s.trim()) || [],
           };
          break;
        case 'parent':
            collectionName = 'parents';
            userData = {
                uid: approvedApp.uid,
                name: approvedApp.name,
                email: approvedApp.email,
                childName: 'N/A', // To be updated by parent
                nearestStop: null,
                assignedRouteId: null,
                avatarUrl: `https://picsum.photos/seed/${approvedApp.name.split(' ')[0]}/100/100`,
            };
            break;
        default:
          throw new Error('Invalid role for approval');
      }

      // Use the UID as the document ID for the user record
      await setDoc(doc(db, collectionName, approvedApp.uid), userData);

      // 2. Update the application status to 'approved'
      const appRef = doc(db, 'applications', appId);
      await updateDoc(appRef, { status: 'approved' });

      // 3. Update UI state
      setApplications(prev => prev.filter(a => a.id !== appId));

      toast({
        title: 'Application Approved',
        description: `${approvedApp.name} has been approved and added as a ${approvedApp.role}.`,
      });

    } catch (error) {
      console.error("Error approving application:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve the application.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (appId: string) => {
    setUpdatingId(appId);
    const rejectedApp = applications.find(a => a.id === appId);
    if (!rejectedApp) {
      setUpdatingId(null);
      return;
    }

    try {
      const appRef = doc(db, 'applications', appId);
      await updateDoc(appRef, { status: 'rejected' });
      
      setApplications(prev => prev.filter(a => a.id !== appId));
      
      toast({
        title: 'Application Rejected',
        description: `${rejectedApp.name}'s application has been rejected.`,
        variant: 'destructive',
      });
    } catch (error) {
        console.error("Error rejecting application:", error);
        toast({
            title: 'Error',
            description: 'Failed to reject the application.',
            variant: 'destructive',
        });
    } finally {
        setUpdatingId(null);
    }
  };

  if (loading) {
    return <ApprovalsSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Application Approvals"
        description="Review and manage new user registration requests."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Applications</CardTitle>
            <CardDescription>
              {applications.length > 0
                ? 'The following users are waiting for approval.'
                : 'There are no pending applications.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Applied On</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.map(app => (
                            <TableRow key={app.id}>
                                <TableCell className="font-medium">{app.name}</TableCell>
                                <TableCell>{app.email}</TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{app.role}</Badge></TableCell>
                                <TableCell>{new Date(app.appliedDate).toLocaleDateString()}</TableCell>
                                <TableCell className="space-x-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleApprove(app.id)} 
                                      disabled={updatingId === app.id}
                                    >
                                        {updatingId === app.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        Approve
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive" 
                                      onClick={() => handleReject(app.id)}
                                      disabled={updatingId === app.id}
                                    >
                                       {updatingId === app.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :  <X className="mr-2 h-4 w-4" />}
                                       Reject
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <UserPlus className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
                <p className="mt-1 text-sm">No new applications to review at this time.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

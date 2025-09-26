

'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import type { UserRole, Vehicle, StopTimestamp, Parent, Student, Driver } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, Users, CheckCircle, AlertTriangle, UserCircle, MapPin, ArrowRight, Play, Check, AlertCircle, MessageSquare, Phone, Clock, BusFront, Baby, GraduationCap, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useSearchParams } from 'next/navigation';
import { getDrivers, getVehicles, getParents, getStudents, getRoutes } from '@/lib/firebase/utils';
import type { Route } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSkeleton } from '@/components/loading-skeleton';


function ActivityLog({ timestamps }: { timestamps: StopTimestamp[] }) {
    if (timestamps.length === 0) {
        return <p className="text-xs text-muted-foreground">No activity recorded yet.</p>;
    }

    return (
        <Collapsible className="w-full">
            <CollapsibleTrigger asChild>
                 <Button variant="link" className="p-0 h-auto text-xs">
                    View Activity Log
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
                <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2">
                    {timestamps.map((log, index) => (
                        <li key={index} className="mb-4 ml-4">
                            <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{log.stop}</h3>
                             {log.arrivalTime && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Arrived at {log.arrivalTime}
                                </p>
                            )}
                            {log.departureTime && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Departed at {log.departureTime}
                                </p>
                            )}
                        </li>
                    ))}
                </ol>
            </CollapsibleContent>
        </Collapsible>
    );
}

function AdminDashboardSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Admin Dashboard" description="Overview of the school's fleet and personnel." />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><Skeleton className="h-8 w-1/4" /></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><Skeleton className="h-8 w-1/4" /></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vehicles Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><Skeleton className="h-8 w-1/4" /></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned Drivers</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent><Skeleton className="h-8 w-1/4" /></CardContent>
          </Card>
        </div>
        <div className="grid gap-8 mt-8 lg:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardContent className="flex gap-4">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>Live Vehicle Status</CardTitle>
                <CardDescription>Real-time location updates from active vehicles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}


function AdminDashboard() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [d, v, r] = await Promise.all([getDrivers(), getVehicles(), getRoutes()]);
      setDrivers(d);
      setVehicles(v);
      setRoutes(r);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  const totalDrivers = drivers.length;
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.isAvailable).length;
  const unassignedDrivers = drivers.filter(d => !d.assignedVehicleId).length;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Admin Dashboard" description="Overview of the school's fleet and personnel." />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDrivers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVehicles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vehicles Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableVehicles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned Drivers</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unassignedDrivers}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 mt-8 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Button asChild>
                        <Link href="/assignments?role=admin">Manage Assignments</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/drivers?role=admin">View Drivers</Link>
                    </Button>
                </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>Live Vehicle Status</CardTitle>
                <CardDescription>Real-time location updates from active vehicles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {vehicles.filter(v => !v.isAvailable && v.routeId).map(vehicle => {
                  const driver = drivers.find(d => d.assignedVehicleId === vehicle.id);
                  const route = routes.find(r => r.id === vehicle.routeId);
                  if (!route || !route.stops) return null;
                  
                  const currentStop = route.stops[vehicle.currentStopIndex];
                  const nextStop = route.stops[vehicle.currentStopIndex + 1];

                  return (
                    <div key={vehicle.id} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-muted rounded-md">
                          <Truck className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{vehicle.model} <span className="font-normal text-muted-foreground">({driver?.name || 'N/A'})</span></p>
                           {vehicle.locationStatus === 'ISSUE_REPORTED' && (
                              <div className="text-sm text-destructive flex items-start gap-2 mt-1">
                                  <AlertCircle className="w-4 h-4 mt-0.5"/>
                                  <div>
                                      <p className="font-semibold">Stopped: {vehicle.statusNotes}</p>
                                  </div>
                              </div>
                          )}
                          {vehicle.locationStatus === 'AT_STOP' && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3"/> Reached {currentStop}
                            </p>
                          )}
                          {vehicle.locationStatus === 'IN_TRANSIT' && nextStop && (
                            <p className="text-sm text-blue-600 flex items-center gap-2">
                              <span>{currentStop}</span>
                              <ArrowRight className="w-3 h-3"/>
                              <span>{nextStop}</span>
                            </p>
                          )}
                        </div>
                        <Badge variant={vehicle.locationStatus === 'ISSUE_REPORTED' ? 'destructive' : vehicle.locationStatus === 'AT_STOP' ? 'default' : 'secondary'}>
                            {vehicle.locationStatus === 'AT_STOP' ? 'At Stop' : vehicle.locationStatus === 'IN_TRANSIT' ? 'In Transit' : 'Issue Reported'}
                        </Badge>
                      </div>
                      <div className="mt-2 pl-10">
                        <ActivityLog timestamps={vehicle.stopTimestamps || []} />
                      </div>
                    </div>
                  )
                })}
                 {vehicles.filter(v => !v.isAvailable).length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">No vehicles are currently active.</div>
                )}
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}

function DriverDashboardSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Driver Dashboard" description="Loading your information..." />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Assigned Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="rounded-lg aspect-[4/3] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-10 w-36" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Live Route Status</CardTitle>
            <CardDescription><Skeleton className="h-4 w-40" /></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-muted-foreground">Current Status</span>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-1/4 mb-1" />
                <Skeleton className="h-7 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3 pt-4">
              <h4 className="font-semibold">Full Route</h4>
              <div className="space-y-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function DriverDashboard() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
      async function fetchData() {
          // Mock logged in driver id
          const loggedInDriverId = 'D002';
          const driverData = await getDrivers().then(drivers => drivers.find(d => d.id === loggedInDriverId));
          
          if (driverData) {
            setDriver(driverData);
            if (driverData.assignedVehicleId) {
                const vehicleData = await getVehicles().then(vehicles => vehicles.find(v => v.id === driverData.assignedVehicleId));
                setVehicle(vehicleData || null);
                if (vehicleData?.routeId) {
                    const routeData = await getRoutes().then(routes => routes.find(r => r.id === vehicleData.routeId));
                    setRoute(routeData || null);
                }
            }
          }
          setLoading(false);
      }
      fetchData();
  }, []);

  const [issueNote, setIssueNote] = useState("");
  const [isIssueDialogOpen, setIssueDialogOpen] = useState(false);

  const handleStateChange = (updates: Partial<Vehicle>) => {
    if (!vehicle) return;
    const updatedVehicle = { ...vehicle, ...updates };
    setVehicle(updatedVehicle);
    // In a real app, you would also save this updated vehicle state to Firestore here
  }
  
  const handleReached = () => {
    if (!vehicle || !route || !route.stops) return;
    const now = new Date();
    const time = format(now, 'p');
    const currentStopName = route.stops[vehicle.currentStopIndex];
    
    let newTimestamps = [...(vehicle.stopTimestamps || [])];
    const existingLogIndex = newTimestamps.findIndex(t => t.stop === currentStopName);

    if (existingLogIndex > -1) {
        newTimestamps[existingLogIndex].arrivalTime = time;
    } else {
        newTimestamps.push({ stop: currentStopName, arrivalTime: time });
    }

    handleStateChange({ locationStatus: 'AT_STOP', statusNotes: undefined, stopTimestamps: newTimestamps });
  }

  const handleDepart = () => {
     if (!vehicle || !route || !route.stops) return;
     const now = new Date();
     const time = format(now, 'p');
     const nextStopIndex = vehicle.currentStopIndex + 1;

     if (nextStopIndex < route.stops.length) {
        let newTimestamps = [...(vehicle.stopTimestamps || [])];
        const currentStopName = route.stops[vehicle.currentStopIndex];
        const existingLogIndex = newTimestamps.findIndex(t => t.stop === currentStopName);
        
        if (existingLogIndex > -1) {
            newTimestamps[existingLogIndex].departureTime = time;
        } else {
            newTimestamps.push({ stop: currentStopName, departureTime: time });
        }
        
        handleStateChange({ locationStatus: 'IN_TRANSIT', currentStopIndex: nextStopIndex, stopTimestamps: newTimestamps });
     }
  }

  const handleReportIssue = () => {
      if (!vehicle || !issueNote) return;
      handleStateChange({ locationStatus: 'ISSUE_REPORTED', statusNotes: issueNote });
      toast({ title: 'Issue Reported', description: 'Admin has been notified.' });
      setIssueNote('');
      setIssueDialogOpen(false);
  }

  if (loading) {
    return <DriverDashboardSkeleton />;
  }

  if (!driver) {
     return (
       <div className="flex flex-col h-full">
        <PageHeader title="Driver Dashboard" description="Could not load driver data." />
        <main className="flex-1 p-6 text-center">Please contact support.</main>
      </div>
     )
  }

  const isLastStop = vehicle && route && route.stops ? vehicle.currentStopIndex === route.stops.length - 1 : false;
  const currentStop = vehicle && route && route.stops ? route.stops[vehicle.currentStopIndex] : null;
  const nextStop = vehicle && route && route.stops && vehicle.currentStopIndex < route.stops.length -1 ? route.stops[vehicle.currentStopIndex + 1] : "End of Route";


  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Driver Dashboard" description={`Welcome back, ${driver.name}!`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Assigned Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle ? (
              <div className="space-y-4">
                 <Image
                  src={vehicle.imageUrl}
                  alt={vehicle.model}
                  width={400}
                  height={300}
                  className="rounded-lg object-cover aspect-[4/3] w-full"
                  data-ai-hint="school bus"
                />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-headline">{vehicle.model}</h3>
                  <p className="text-lg text-muted-foreground">{vehicle.licensePlate}</p>
                  <Badge variant={vehicle.maintenanceSchedule === 'Service due' ? 'destructive' : 'default'}>{vehicle.maintenanceSchedule}</Badge>
                   <p><span className="font-semibold">Current Location:</span> {vehicle.currentLocation}</p>
                  <Button asChild>
                    <Link href="/maintenance?role=driver">Log Daily Mileage</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Vehicle Assigned</h3>
                <p className="mt-1 text-sm text-muted-foreground">Please contact an administrator for your assignment.</p>
              </div>
            )}
          </CardContent>
        </Card>
        {vehicle && route && route.stops && route.stops.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Live Route Status</CardTitle>
              <CardDescription>{route.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-muted-foreground">Current Status</span>
                   <Badge variant={vehicle.locationStatus === 'ISSUE_REPORTED' ? 'destructive' : vehicle.locationStatus === 'AT_STOP' ? 'default' : 'secondary'}>
                       {vehicle.locationStatus === 'AT_STOP' ? 'At Stop' : vehicle.locationStatus === 'IN_TRANSIT' ? 'In Transit' : 'Issue Reported'}
                   </Badge>
                </div>
                 {vehicle.locationStatus === 'IN_TRANSIT' ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Next Stop</p>
                    <p className="font-bold text-lg">{nextStop}</p>
                  </div>
                ) : (
                   <div>
                    <p className="text-sm text-muted-foreground">Current Stop</p>
                    <p className="font-bold text-lg">{currentStop}</p>
                  </div>
                )}
                 {vehicle.locationStatus === 'ISSUE_REPORTED' && (
                    <div className="mt-2 text-destructive flex items-center gap-2">
                        <MessageSquare className="w-4 h-4"/>
                        <p className="text-sm font-semibold">{vehicle.statusNotes}</p>
                    </div>
                 )}
              </div>
                
                {vehicle.locationStatus === 'IN_TRANSIT' && (
                    <Button className="w-full" onClick={handleReached}>
                        <Check className="mr-2" /> Mark as Reached {nextStop}
                    </Button>
                )}

                {vehicle.locationStatus === 'AT_STOP' && !isLastStop && (
                     <Button className="w-full" onClick={handleDepart}>
                       <Play className="mr-2" /> Depart for {nextStop}
                    </Button>
                )}

                {vehicle.locationStatus === 'AT_STOP' && isLastStop && (
                     <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => {
                        toast({title: 'Return trip not implemented'})
                     }}>
                       <ArrowRight className="mr-2" /> Start Return Trip
                    </Button>
                )}

                <Dialog open={isIssueDialogOpen} onOpenChange={setIssueDialogOpen}>
                    <DialogTrigger asChild>
                         <Button variant="outline" className="w-full">
                            <AlertCircle className="mr-2" /> Stop & Report Issue
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Report an Issue</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p>Describe the issue or reason for the unscheduled stop.</p>
                            <Textarea 
                                placeholder="e.g., 'Flat tire at Elm Street', 'Heavy traffic jam'"
                                value={issueNote}
                                onChange={e => setIssueNote(e.target.value)}
                            />
                        </div>
                        <DialogFooter className="sm:justify-between gap-2">
                           <Button asChild variant="secondary">
                             <a href="tel:+918757040290"><Phone className="mr-2"/> Call for Help</a>
                           </Button>
                           <Button variant="destructive" onClick={handleReportIssue}>Submit Report</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


               <div className="space-y-3 pt-4">
                  <h4 className="font-semibold">Full Route</h4>
                  <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2">
                    {route.stops.map((stop, index) => (
                       <li key={index} className="mb-3 ml-4">
                          <div className={`absolute w-3 h-3 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900 ${index < vehicle.currentStopIndex ? 'bg-primary' : index === vehicle.currentStopIndex ? 'bg-green-500 ring-4 ring-green-200' : 'bg-gray-400'}`}></div>
                          <p className={`text-sm font-medium ${index === vehicle.currentStopIndex ? 'text-primary font-bold' : ''}`}>
                            {stop}
                            {index === vehicle.currentStopIndex && vehicle.locationStatus === 'AT_STOP' && <span className="text-xs font-normal"> (You are here)</span>}
                          </p>
                      </li>
                    ))}
                  </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function ParentDashboardSkeleton() {
    return (
        <div className="flex flex-col h-full">
            <PageHeader title="Parent Dashboard" description="Loading..." />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Live Bus Status</CardTitle>
                        <CardDescription>Real-time tracking of your child's school bus.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                            <div className="flex justify-between items-center mb-4">
                               <div>
                                   <Skeleton className="h-6 w-48 mb-2" />
                                   <Skeleton className="h-4 w-32" />
                               </div>
                               <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                             <div>
                                <Skeleton className="h-4 w-1/4 mb-1" />
                                <Skeleton className="h-5 w-3/4" />
                            </div>
                        </div>
                        <div className="space-y-3 pt-4">
                            <h4 className="font-semibold">Route Progress</h4>
                             <div className="space-y-4">
                                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                             </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

function ParentDashboard() {
  const [parent, setParent] = useState<Parent | null>(null);
  const [assignedRoute, setAssignedRoute] = useState<Route | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        const loggedInParentId = 'P001'; // Mock logged-in parent
        const parentData = await getParents().then(parents => parents.find(p => p.id === loggedInParentId));
        setParent(parentData || null);

        if (parentData?.assignedRouteId) {
            const [routes, vehicles, drivers] = await Promise.all([getRoutes(), getVehicles(), getDrivers()]);
            const routeData = routes.find(r => r.id === parentData.assignedRouteId);
            setAssignedRoute(routeData || null);

            if (routeData) {
                const vehicleData = vehicles.find(v => v.routeId === routeData.id);
                setVehicle(vehicleData || null);
                if (vehicleData) {
                    const driverData = drivers.find(d => d.assignedVehicleId === vehicleData.id);
                    setDriver(driverData || null);
                }
            }
        }
        setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
     return <ParentDashboardSkeleton />;
  }

  if (!parent) {
     return (
       <div className="flex flex-col h-full">
        <PageHeader title="Parent Dashboard" description="Could not load parent data." />
        <main className="flex-1 p-6 text-center">Please contact support.</main>
      </div>
     )
  }

  if (!parent.nearestStop || !assignedRoute) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Parent Dashboard" description={`Welcome, ${parent.name}!`} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Baby className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4">Please set up your profile to start tracking your child's bus.</p>
              <Button asChild className="mt-4">
                <Link href="/profile?role=parent">Set Up Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  const currentStopIndex = vehicle?.currentStopIndex ?? 0;
  const currentStop = assignedRoute.stops[currentStopIndex];
  const nextStop = assignedRoute.stops[currentStopIndex + 1];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Parent Dashboard" description={`Tracking bus for ${parent.childName}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Live Bus Status</CardTitle>
                <CardDescription>Real-time tracking of your child's school bus.</CardDescription>
            </CardHeader>
            {!vehicle ? (
                 <CardContent>
                    <div className="text-center py-10 text-muted-foreground">
                        <BusFront className="mx-auto h-12 w-12" />
                        <p className="mt-4">The assigned bus is not currently active.</p>
                    </div>
                </CardContent>
            ) : (
                <CardContent className="space-y-6">
                     <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-center mb-4">
                           <div>
                               <p className="font-semibold text-lg">{vehicle.model}</p>
                               <p className="text-sm text-muted-foreground">{vehicle.licensePlate} (Driver: {driver?.name || 'N/A'})</p>
                           </div>
                           <Badge variant={vehicle.locationStatus === 'ISSUE_REPORTED' ? 'destructive' : vehicle.locationStatus === 'AT_STOP' ? 'default' : 'secondary'}>
                               {vehicle.locationStatus === 'AT_STOP' ? 'At Stop' : vehicle.locationStatus === 'IN_TRANSIT' ? 'In Transit' : 'Issue Reported'}
                           </Badge>
                        </div>
                        {vehicle.locationStatus === 'IN_TRANSIT' ? (
                        <div>
                            <p className="text-sm text-muted-foreground">Currently between</p>
                            <div className="flex items-center gap-2 font-semibold">
                                <MapPin className="w-4 h-4 text-primary"/>
                                <span>{currentStop}</span>
                                <ArrowRight className="w-4 h-4 text-muted-foreground"/>
                                <span>{nextStop}</span>
                            </div>
                        </div>
                        ) : (
                        <div>
                            <p className="text-sm text-muted-foreground">Currently at</p>
                            <div className="flex items-center gap-2 font-semibold">
                                <MapPin className="w-4 h-4 text-green-500"/>
                                <span>{currentStop}</span>
                            </div>
                        </div>
                        )}
                        {vehicle.locationStatus === 'ISSUE_REPORTED' && (
                            <div className="mt-2 text-destructive flex items-center gap-2">
                                <AlertCircle className="w-4 h-4"/>
                                <p className="text-sm font-semibold">{vehicle.statusNotes}</p>
                            </div>
                        )}
                     </div>

                    <div className="space-y-3 pt-4">
                        <h4 className="font-semibold">Route Progress</h4>
                        <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2">
                            {assignedRoute.stops.map((stop, index) => {
                                const isParentStop = stop === parent.nearestStop;
                                return (
                                <li key={index} className="mb-3 ml-4">
                                    <div className={`absolute w-3 h-3 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900 ${index < currentStopIndex ? 'bg-primary' : index === currentStopIndex ? 'bg-green-500 ring-4 ring-green-200' : 'bg-gray-400'}`}></div>
                                    <p className={`text-sm font-medium ${index === currentStopIndex ? 'text-primary font-bold' : ''}`}>
                                        {stop}
                                        {isParentStop && <span className="text-xs font-normal text-accent"> (Your Stop)</span>}
                                        {index === currentStopIndex && vehicle.locationStatus === 'AT_STOP' && <span className="text-xs font-normal"> (Bus is here)</span>}
                                    </p>
                                </li>
                                )
                            })}
                        </ol>
                    </div>
                </CardContent>
            )}
        </Card>
      </main>
    </div>
  )
}

function TeacherDashboard() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Teacher Dashboard" description="Welcome! Manage your students and classes." />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>View your students and manage their information.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12">
                    <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Manage Your Students</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        You can add new students and update their records.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/students?role=teacher">Go to Student Management</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}


function StudentDashboardSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Student Dashboard" description="Loading..." />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>My Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ))}
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My Bus</CardTitle>
            <CardDescription>Live tracking for your school bus.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between items-center mb-2">
                   <div>
                       <Skeleton className="h-6 w-40 mb-2" />
                       <Skeleton className="h-4 w-32" />
                   </div>
                   <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            </div>
            <div className="space-y-3 pt-2">
                <h4 className="font-semibold">Route Progress</h4>
                <div className="space-y-4">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


function StudentDashboard() {
    const [student, setStudent] = useState<Student | null>(null);
    const [parent, setParent] = useState<Parent | null>(null);
    const [assignedRoute, setAssignedRoute] = useState<Route | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [driver, setDriver] = useState<Driver | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const loggedInStudentId = 'S001'; // Mock logged-in student
            const studentData = await getStudents().then(students => students.find(s => s.id === loggedInStudentId));
            setStudent(studentData || null);

            if (studentData?.parentId) {
                 const [parents, routes, vehicles, drivers] = await Promise.all([getParents(), getRoutes(), getVehicles(), getDrivers()]);
                 const parentData = parents.find(p => p.id === studentData.parentId);
                 setParent(parentData || null);

                 if (parentData?.assignedRouteId) {
                     const routeData = routes.find(r => r.id === parentData.assignedRouteId);
                     setAssignedRoute(routeData || null);

                     if(routeData) {
                         const vehicleData = vehicles.find(v => v.routeId === routeData.id);
                         setVehicle(vehicleData || null);

                         if (vehicleData) {
                             const driverData = drivers.find(d => d.assignedVehicleId === vehicleData.id);
                             setDriver(driverData || null);
                         }
                     }
                 }
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) {
       return <StudentDashboardSkeleton />;
    }

    if (!student) {
       return (
       <div className="flex flex-col h-full">
        <PageHeader title="Student Dashboard" description="Could not load student data." />
        <main className="flex-1 p-6 text-center">Please contact support.</main>
      </div>
     )
    }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Student Dashboard" description={`Welcome, ${student.name}!`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>My Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{student.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Class</span>
                    <span className="font-medium">{student.class}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Roll No.</span>
                    <span className="font-medium">{student.rollNo}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span className="font-medium">{student.dob}</span>
                </div>
                 {parent && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Parent</span>
                        <span className="font-medium">{parent.name}</span>
                    </div>
                )}
                {student.resultCardUrl && (
                    <Button asChild className="w-full">
                        <Link href={student.resultCardUrl} target="_blank">
                            <Download className="mr-2"/> View My Result Card
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>My Bus</CardTitle>
                <CardDescription>Live tracking for your school bus.</CardDescription>
            </CardHeader>
            <CardContent>
                 {!vehicle || !assignedRoute ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <BusFront className="mx-auto h-12 w-12" />
                        <p className="mt-4">Your bus is not currently active or not assigned.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                            <div className="flex justify-between items-center mb-2">
                            <div>
                                <p className="font-semibold text-lg">{vehicle.model}</p>
                                <p className="text-sm text-muted-foreground">{vehicle.licensePlate} (Driver: {driver?.name || 'N/A'})</p>
                            </div>
                            <Badge variant={vehicle.locationStatus === 'ISSUE_REPORTED' ? 'destructive' : vehicle.locationStatus === 'AT_STOP' ? 'default' : 'secondary'}>
                                {vehicle.locationStatus === 'AT_STOP' ? 'At Stop' : vehicle.locationStatus === 'IN_TRANSIT' ? 'In Transit' : 'Issue Reported'}
                            </Badge>
                            </div>
                        </div>
                        <div className="space-y-3 pt-2">
                            <h4 className="font-semibold">Route Progress</h4>
                            <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2">
                                {assignedRoute.stops.map((stop, index) => {
                                    const isYourStop = stop === parent?.nearestStop;
                                    return (
                                    <li key={index} className="mb-3 ml-4">
                                        <div className={`absolute w-3 h-3 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900 ${index < vehicle.currentStopIndex ? 'bg-primary' : index === vehicle.currentStopIndex ? 'bg-green-500 ring-4 ring-green-200' : 'bg-gray-400'}`}></div>
                                        <p className={`text-sm font-medium ${index === vehicle.currentStopIndex ? 'text-primary font-bold' : ''}`}>
                                            {stop}
                                            {isYourStop && <span className="text-xs font-normal text-accent"> (Your Stop)</span>}
                                            {index === vehicle.currentStopIndex && vehicle.locationStatus === 'AT_STOP' && <span className="text-xs font-normal"> (Bus is here)</span>}
                                        </p>
                                    </li>
                                    )
                                })}
                            </ol>
                        </div>
                    </div>
                 )}
            </CardContent>
         </Card>
      </main>
    </div>
  );
}


function DashboardPage() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const role: UserRole = (roleParam === 'admin' || roleParam === 'driver' || roleParam === 'parent' || roleParam === 'teacher' || roleParam === 'student') ? roleParam : 'admin';

  switch(role) {
    case 'admin':
        return <AdminDashboard />;
    case 'driver':
        return <DriverDashboard />;
    case 'parent':
        return <ParentDashboard />;
    case 'teacher':
        return <TeacherDashboard />;
    case 'student':
        return <StudentDashboard />;
    default:
        return (
            <div className="p-6">
            <h1 className="text-2xl">Dashboard</h1>
            <p>Role not recognized. Please log in again.</p>
            </div>
        );
  }
}

export default function DashboardSuspenseWrapper() {
  return (
    <Suspense fallback={<LoadingSkeleton message="Loading Dashboard..." />}>
      <DashboardPage />
    </Suspense>
  )
}

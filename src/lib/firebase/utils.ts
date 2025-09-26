
'use server';

import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Driver, Vehicle, Parent, Student, Route, Application, Teacher } from '@/lib/types';

export async function getDrivers(): Promise<Driver[]> {
  const driversCol = collection(db, 'drivers');
  const driverSnapshot = await getDocs(driversCol);
  const driverList = driverSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
  return driverList;
}

export async function getDriver(id: string): Promise<Driver | null> {
    const driverDoc = doc(db, 'drivers', id);
    const driverSnapshot = await getDoc(driverDoc);
    if (driverSnapshot.exists()) {
        return { id: driverSnapshot.id, ...driverSnapshot.data() } as Driver;
    }
    return null;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const vehiclesCol = collection(db, 'vehicles');
  const vehicleSnapshot = await getDocs(vehiclesCol);
  const vehicleList = vehicleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
  return vehicleList;
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
    const vehicleDoc = doc(db, 'vehicles', id);
    const vehicleSnapshot = await getDoc(vehicleDoc);
    if (vehicleSnapshot.exists()) {
        return { id: vehicleSnapshot.id, ...vehicleSnapshot.data() } as Vehicle;
    }
    return null;
}

export async function getParents(): Promise<Parent[]> {
  const parentsCol = collection(db, 'parents');
  const parentSnapshot = await getDocs(parentsCol);
  const parentList = parentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Parent));
  return parentList;
}

export async function getStudents(): Promise<Student[]> {
  const studentsCol = collection(db, 'students');
  const studentSnapshot = await getDocs(studentsCol);
  const studentList = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
  return studentList;
}

export async function getTeachers(): Promise<Teacher[]> {
  const teachersCol = collection(db, 'teachers');
  const teacherSnapshot = await getDocs(teachersCol);
  const teacherList = teacherSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
  return teacherList;
}

export async function getRoutes(): Promise<Route[]> {
  const routesCol = collection(db, 'routes');
  const routeSnapshot = await getDocs(routesCol);
  const routeList = routeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
  return routeList;
}

export async function getApplications(): Promise<Application[]> {
  const applicationsCol = collection(db, 'applications');
  const appQuery = query(applicationsCol, where('status', '==', 'pending'));
  const appSnapshot = await getDocs(appQuery);
  const appList = appSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
  return appList;
}


export async function getApplicationByUid(uid: string): Promise<Application | null> {
    const applicationsCol = collection(db, 'applications');
    const q = query(applicationsCol, where("uid", "==", uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    
    const docData = querySnapshot.docs[0];
    return { id: docData.id, ...docData.data() } as Application;
}



'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import type { Student, Parent } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Download } from 'lucide-react';
import Link from 'next/link';
import { getStudents, getParents } from '@/lib/firebase/utils';
import { addDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Skeleton } from '@/components/ui/skeleton';

const studentFormSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    fatherName: z.string().min(2, { message: "Father's name is required." }),
    motherName: z.string().min(2, { message: "Mother's name is required." }),
    dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date of birth' }),
    class: z.string().min(1, { message: 'Class is required.' }),
    rollNo: z.string().min(1, { message: 'Roll number is required.' }),
    parentId: z.string().optional(),
    resultCardUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

function StudentsPageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Manage Students" description="Add, view, and manage student data."/>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Students</CardTitle>
            <Skeleton className="h-10 w-32" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Result Card</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        const [studentsData, parentsData] = await Promise.all([getStudents(), getParents()]);
        setStudents(studentsData);
        setParents(parentsData);
        setLoading(false);
    }
    fetchData();
  }, []);

  const form = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
        name: '',
        fatherName: '',
        motherName: '',
        dob: '',
        class: '',
        rollNo: '',
        parentId: '',
        resultCardUrl: '',
    },
  });

  async function onSubmit(values: z.infer<typeof studentFormSchema>) {
    try {
        const newStudentData = {
            ...values,
        };
        const docRef = await addDoc(collection(db, "students"), newStudentData);

        setStudents(prev => [...prev, { id: docRef.id, ...newStudentData }]);
        toast({
        title: 'Student Added',
        description: `${newStudentData.name} has been added to the system.`,
        });
        setIsDialogOpen(false);
        form.reset();
    } catch (error) {
        console.error("Error adding student: ", error);
        toast({ title: 'Error', description: 'Failed to add student.', variant: 'destructive' });
    }
  }
  
  const handleDeleteStudent = async (studentId: string) => {
    try {
        await deleteDoc(doc(db, "students", studentId));
        setStudents(prev => prev.filter(s => s.id !== studentId));
        toast({
            title: 'Student Removed',
            description: 'The student has been removed from the system.',
            variant: 'destructive'
        });
    } catch (error) {
        console.error("Error deleting student: ", error);
        toast({ title: 'Error', description: 'Failed to remove student.', variant: 'destructive' });
    }
  }

  if (loading) {
      return <StudentsPageSkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Manage Students"
        description="Add, view, and manage student data."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Students</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Enter the student's details to register them.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Billy Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="rollNo"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Roll No.</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. 21" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="fatherName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Father's Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="motherName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Mother's Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Jane Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="dob"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="class"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Class</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. 5th" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="parentId"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                <FormLabel>Assign Parent</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a registered parent..." />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {parents.map(parent => (
                                        <SelectItem key={parent.id} value={parent.id}>{parent.name} ({parent.email})</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="resultCardUrl"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                <FormLabel>Result Card Link</FormLabel>
                                <FormControl>
                                   <Input placeholder="https://your-link.com/result.pdf" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="col-span-2">
                            <Button type="submit">Save Student</Button>
                        </DialogFooter>
                    </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Result Card</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const parent = parents.find(p => p.id === student.parentId);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>{student.rollNo}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.class}</TableCell>
                       <TableCell>{parent ? parent.name : 'Not Assigned'}</TableCell>
                      <TableCell>
                        {student.resultCardUrl ? (
                           <Button variant="link" asChild>
                             <Link href={student.resultCardUrl} target="_blank">
                               <Download className="mr-2 h-4 w-4" /> View
                             </Link>
                           </Button>
                        ) : 'Not Uploaded'}
                      </TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(student.id)}>
                             <Trash2 className="mr-2 h-4 w-4" />
                             Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

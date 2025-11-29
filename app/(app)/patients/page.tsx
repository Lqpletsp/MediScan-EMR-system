
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, PlusCircle, UsersRound, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getPatients, addPatient, deletePatient } from "@/lib/storage";
import type { Patient } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

const patientSchema = z.object({
  name: z.string().min(1, "Patient name is required"),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required" }),
  contact: z.string().min(1, "Contact information is required"),
  address: z.string().min(1, "Address is required"),
  medicalHistory: z.string().optional(), // Will be split into string[]
});

type PatientFormValues = z.infer<typeof patientSchema>;

export default function PatientsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      gender: undefined,
      contact: "",
      address: "",
      medicalHistory: "",
    },
  });

  const fetchPatients = React.useCallback(() => {
    if (user) {
      setPatients(getPatients(user.id));
    }
  }, [user]);

  React.useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);


  function onSubmit(data: PatientFormValues) {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    const patientData = {
      name: data.name,
      dateOfBirth: format(data.dateOfBirth, "yyyy-MM-dd"),
      gender: data.gender,
      contact: data.contact,
      address: data.address,
      medicalHistory: data.medicalHistory?.split("\n").filter(line => line.trim() !== '') || [],
    };

    addPatient(patientData, user.id);
    toast({
      title: "Patient Added",
      description: `${data.name} has been added to the records.`,
    });
    
    fetchPatients(); // Re-fetch patients after adding
    setIsDialogOpen(false);
    form.reset();
  }
  
  const handleDelete = (e: React.MouseEvent, patientId: string, patientName: string) => {
    e.stopPropagation(); // Prevents the row's onClick from firing
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${patientName}'s record? This will also remove all associated appointments and prescriptions and cannot be undone.`)) {
      deletePatient(patientId);
      fetchPatients(); // Re-fetch patients after deleting
      toast({
        title: "Patient Deleted",
        description: `${patientName}'s record and all associated data have been deleted.`,
        variant: "destructive",
      });
    }
  };

  const sortedPatients = React.useMemo(() => {
    return [...patients].sort((a, b) => a.name.localeCompare(b.name));
  }, [patients]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-headline font-semibold flex items-center"><UsersRound className="mr-3 h-8 w-8" />Patient Records</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Fill in the details for the new patient.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            classNames={{
                              caption_label: "hidden",
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact (Email | Phone)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., john.doe@example.com | (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 123 Main St, Anytown, USA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical History (One item per line)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Hypertension\nType 2 Diabetes\nAsthma" {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Add Patient</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient List</CardTitle>
          <CardDescription>View and manage all patient records. Click a row to view details.</CardDescription>
        </CardHeader>
        <CardContent>
          {patients.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPatients.map((patient) => (
                    <TableRow key={patient.id} onClick={() => router.push(`/patients/${patient.id}`)} className="cursor-pointer">
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{format(parseISO(patient.dateOfBirth), "PP")}</TableCell>
                      <TableCell>{patient.gender}</TableCell>
                      <TableCell>{patient.contact}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, patient.id, patient.name)} aria-label="Delete patient">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No patients found. Add a new patient to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

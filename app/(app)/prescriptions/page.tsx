
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, PlusCircle, Edit3, Trash2 } from "lucide-react";

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
import { getPrescriptions, addPrescription, updatePrescription, deletePrescription, getPatients } from "@/lib/storage";
import type { Prescription, Patient } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

const prescriptionSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  patientName: z.string().min(1, "Patient name is required"),
  doctorName: z.string().min(1, "Doctor name is required"),
  date: z.date({ required_error: "Date is required" }),
  medication: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  notes: z.string().optional(),
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

export default function PrescriptionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = React.useState<Prescription[]>([]);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPrescription, setEditingPrescription] = React.useState<Prescription | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patientId: "",
      patientName: "",
      doctorName: user?.name || "",
      date: new Date(),
      medication: "",
      dosage: "",
      frequency: "",
      notes: "",
    },
  });

  const fetchPrescriptions = React.useCallback(() => {
    if (user) {
      setPrescriptions(getPrescriptions(user.id));
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      fetchPrescriptions();
      setPatients(getPatients(user.id));
    }
  }, [user, fetchPrescriptions]);

  React.useEffect(() => {
    if (editingPrescription) {
      form.reset({
        ...editingPrescription,
        date: parseISO(editingPrescription.date),
      });
    } else {
      form.reset({
        patientId: "",
        patientName: "",
        doctorName: user?.name || "",
        date: new Date(),
        medication: "",
        dosage: "",
        frequency: "",
        notes: "",
      });
      setIsEditing(true); // Always editable for new prescriptions
    }
  }, [editingPrescription, form, isDialogOpen, user]);


  function onSubmit(data: PrescriptionFormValues) {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    const prescriptionData = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
    };

    if (editingPrescription) {
      const updatedPrescription: Prescription = {
        ...editingPrescription,
        ...prescriptionData,
      };
      updatePrescription(updatedPrescription);
      toast({
        title: "Prescription Updated",
        description: `Prescription for ${data.patientName} has been updated.`,
      });
    } else {
      addPrescription(prescriptionData, user.id);
      toast({
        title: "Prescription Created",
        description: `Prescription for ${data.patientName} has been created.`,
      });
    }
    
    fetchPrescriptions(); // Re-fetch all prescriptions
    setEditingPrescription(null);
    setIsDialogOpen(false);
    form.reset();
  }
  
  const handleViewDetails = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setIsEditing(false); // Start in read-only mode
    setIsDialogOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, prescription: Prescription) => {
    e.stopPropagation(); // prevent row click from firing
    setEditingPrescription(prescription);
    setIsEditing(true); // Start in edit mode
    setIsDialogOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, prescriptionId: string, patientName: string) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if(window.confirm(`Are you sure you want to delete this prescription for ${patientName}?`)) {
      deletePrescription(prescriptionId);
      fetchPrescriptions(); // Re-fetch all prescriptions
      toast({
        title: "Prescription Deleted",
        description: `The prescription for ${patientName} has been deleted.`,
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    if(editingPrescription) {
        // If we were editing an existing record, just go back to read-only
        setIsEditing(false);
    } else {
        // If it was a new record, close the dialog
        setIsDialogOpen(false);
    }
  }

  const sortedPrescriptions = React.useMemo(() => {
    return [...prescriptions].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [prescriptions]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-headline font-semibold">Prescription Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingPrescription(null);}}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingPrescription(null); setIsEditing(true); setIsDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingPrescription ? "Prescription Details" : "Create New Prescription"}</DialogTitle>
              <DialogDescription>
                {editingPrescription ? (isEditing ? "Update the details for this prescription." : "Viewing prescription details.") : "Fill in the details for the new e-prescription."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          const patient = patients.find(p => p.id === value);
                          if (patient) {
                            field.onChange(value);
                            form.setValue('patientName', patient.name);
                          }
                        }} 
                        value={field.value} 
                        defaultValue={field.value}
                        disabled={!isEditing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients.length === 0 && <SelectItem value="no-patients-placeholder" disabled>No patients available. Add a patient first.</SelectItem>}
                          {patients.map(patient => (
                            <SelectItem key={patient.id} value={patient.id}>{patient.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="doctorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dr. Smith" {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Issue</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild disabled={!isEditing}>
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
                            initialFocus
                            disabled={!isEditing}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Amoxicillin 250mg" {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dosage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosage</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1 tablet, 5ml" {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Twice daily, Every 4 hours" {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Take with food, Complete full course" {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                    {isEditing ? (
                        <>
                            <Button type="button" variant="outline" onClick={() => editingPrescription ? setIsEditing(false) : setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">{editingPrescription ? "Update Prescription" : "Create Prescription"}</Button>
                        </>
                    ) : (
                        <Button type="button" onClick={() => setIsEditing(true)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Edit Prescription
                        </Button>
                    )}
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prescription List</CardTitle>
          <CardDescription>View and manage all patient prescriptions.</CardDescription>
        </CardHeader>
        <CardContent>
          {prescriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id} onClick={() => handleViewDetails(prescription)} className="cursor-pointer">
                      <TableCell className="font-medium">{prescription.patientName}</TableCell>
                      <TableCell>{prescription.medication}</TableCell>
                      <TableCell>{format(parseISO(prescription.date), "PP")}</TableCell>
                      <TableCell>{prescription.doctorName}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={(e) => handleEditClick(e, prescription)} aria-label="Edit prescription">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, prescription.id, prescription.patientName)} aria-label="Delete prescription">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No prescriptions found. Create one to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    

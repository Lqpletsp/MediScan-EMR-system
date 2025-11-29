
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addDays, format, parseISO } from "date-fns";
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
import { getAppointments, addAppointment, updateAppointment, deleteAppointment, getPatients } from "@/lib/storage";
import type { Appointment, Patient } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  patientName: z.string().min(1, "Patient name is required"),
  doctorName: z.string().min(1, "Doctor name is required"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  reason: z.string().min(1, "Reason for appointment is required"),
  status: z.enum(["Scheduled", "Completed", "Cancelled"]).default("Scheduled"),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export default function AppointmentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: "",
      patientName: "",
      doctorName: user?.name || "", 
      time: "09:00",
      reason: "",
      status: "Scheduled",
    },
  });
  
  const fetchAppointments = React.useCallback(() => {
    if (user) {
      setAppointments(getAppointments(user.id));
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      fetchAppointments();
      setPatients(getPatients(user.id));
    }
  }, [user, fetchAppointments]);

  React.useEffect(() => {
    if (editingAppointment) {
      form.reset({
        ...editingAppointment,
        date: parseISO(editingAppointment.date),
      });
    } else {
      form.reset({
        patientId: "",
        patientName: "",
        doctorName: user?.name || "",
        date: selectedDate || new Date(),
        time: "09:00",
        reason: "",
        status: "Scheduled",
      });
    }
  }, [editingAppointment, form, isDialogOpen, selectedDate, user]);


  function onSubmit(data: AppointmentFormValues) {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    const appointmentData = {
      ...data,
      date: format(data.date, "yyyy-MM-dd"),
    };

    if (editingAppointment) {
      const updatedAppointment: Appointment = {
        ...editingAppointment,
        ...appointmentData,
      };
      updateAppointment(updatedAppointment);
      toast({
        title: "Appointment Updated",
        description: `Appointment for ${data.patientName} has been updated.`,
      });
    } else {
      addAppointment(appointmentData, user.id);
      toast({
        title: "Appointment Scheduled",
        description: `${data.patientName}'s appointment on ${format(data.date, "PPP")} at ${data.time} has been scheduled.`,
      });
    }
    
    fetchAppointments(); // Re-fetch all appointments
    setEditingAppointment(null);
    setIsDialogOpen(false);
  }
  
  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleDelete = (appointmentId: string, patientName: string) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (window.confirm(`Are you sure you want to delete the appointment for ${patientName}? This action cannot be undone.`)) {
      deleteAppointment(appointmentId);
      fetchAppointments(); // Re-fetch all appointments
      toast({
        title: "Appointment Deleted",
        description: `The appointment for ${patientName} has been deleted.`,
        variant: "destructive"
      });
    }
  };
  
  const displayedAppointments = React.useMemo(() => {
    return appointments.filter(appt => 
      selectedDate ? format(parseISO(appt.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd") : true
    ).sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime() || a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-headline font-semibold">Appointment Scheduling</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingAppointment(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAppointment(null); setIsDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingAppointment ? "Edit" : "Add New"} Appointment</DialogTitle>
              <DialogDescription>
                {editingAppointment ? "Update the appointment details." : "Fill in the details to schedule a new appointment."}
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
                      <Select onValueChange={(value) => {
                          const patient = patients.find(p => p.id === value);
                          if (patient) {
                            field.onChange(value);
                            form.setValue('patientName', patient.name);
                          }
                        }} value={field.value} defaultValue={field.value}>
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
                        <Input placeholder="e.g., Dr. Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
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
                              disabled={(date) => date < addDays(new Date(), -1) }
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
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time (HH:MM)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Appointment</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Annual checkup, flu symptoms" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingAppointment ? "Update Appointment" : "Schedule Appointment"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
                <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border shadow"
                initialFocus
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Appointments for {selectedDate ? format(selectedDate, "PPP") : "All Dates"}</CardTitle>
              <CardDescription>Manage and view patient appointments.</CardDescription>
            </CardHeader>
            <CardContent>
              {displayedAppointments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">{appointment.patientName}</TableCell>
                          <TableCell>{appointment.doctorName}</TableCell>
                          <TableCell>{appointment.time}</TableCell>
                          <TableCell>{appointment.reason}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              appointment.status === "Scheduled" && "bg-blue-100 text-blue-700",
                              appointment.status === "Completed" && "bg-green-100 text-green-700",
                              appointment.status === "Cancelled" && "bg-red-100 text-red-700"
                            )}>
                              {appointment.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(appointment)} aria-label="Edit appointment">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(appointment.id, appointment.patientName)} aria-label="Delete appointment">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No appointments scheduled for {selectedDate ? format(selectedDate, "PPP") : "the selected criteria"}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

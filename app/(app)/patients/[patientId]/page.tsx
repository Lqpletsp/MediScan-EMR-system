
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, User, Save, FileText, CalendarDays, Trash2, ArrowLeft, BrainCircuit, FileCheck, ScanSearch, Edit3, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getPatientById, updatePatient, deletePatient, getAppointmentsByPatient, getPrescriptionsByPatient, getAnalysesByPatient, deleteAnalysis } from "@/lib/storage";
import type { Patient, Appointment, Prescription, MedicalAnalysis } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { type DentalXrayAnalysisOutput, type GenerateDiagnosisSummaryOutput } from "@/ai/flows/dental-xray-analysis";
import { Badge } from "@/components/ui/badge";


const PatientAppointmentsChart = dynamic(
  () => import("@/components/charts/PatientAppointmentsChart"),
  { 
    ssr: false,
    loading: () => <div className="h-[250px] w-full flex items-center justify-center"><Skeleton className="h-[230px] w-full" /></div>
  }
);


const patientSchema = z.object({
  name: z.string().min(1, "Patient name is required"),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required" }),
  contact: z.string().min(1, "Contact information is required"),
  address: z.string().min(1, "Address is required"),
  medicalHistory: z.string().optional(), // Will be split into string[]
});

type PatientFormValues = z.infer<typeof patientSchema>;

export default function PatientDetailPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = React.useState<Prescription[]>([]);
  const [analyses, setAnalyses] = React.useState<MedicalAnalysis[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  });
  
  const isDentalResult = (result: any): result is DentalXrayAnalysisOutput => {
      return result && 'highlightedImageDataUri' in result;
  }
  const isStandardResult = (result: any): result is GenerateDiagnosisSummaryOutput => {
      return result && 'diagnosisSummary' in result;
  }

  const fetchAnalyses = React.useCallback(() => {
    if (patientId) {
      const patientAnalyses = getAnalysesByPatient(patientId);
      setAnalyses(patientAnalyses.sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()));
    }
  }, [patientId]);

  React.useEffect(() => {
    if (user && patientId) {
      const foundPatient = getPatientById(patientId);
      if (foundPatient) {
        setPatient(foundPatient);
        const patientAppointments = getAppointmentsByPatient(foundPatient.id);
        const patientPrescriptions = getPrescriptionsByPatient(foundPatient.id);
        fetchAnalyses();
        
        setAppointments(patientAppointments.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
        setPrescriptions(patientPrescriptions.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
        
        form.reset({
          ...foundPatient,
          dateOfBirth: parseISO(foundPatient.dateOfBirth),
          medicalHistory: foundPatient.medicalHistory.join("\n"),
        });
      } else {
        toast({ title: "Error", description: "Patient not found or access denied.", variant: "destructive" });
        router.push('/patients');
      }
      setIsLoading(false);
    }
  }, [user, patientId, form, router, toast, fetchAnalyses]);
  
  const appointmentHistoryChartData = React.useMemo(() => {
    const data: { [key: string]: number } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const sortedAppointments = [...appointments].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    sortedAppointments.forEach(appt => {
      const monthKey = format(parseISO(appt.date), "MMM yyyy");
      data[monthKey] = (data[monthKey] || 0) + 1;
    });

    const allMonths = new Set<string>();
    if (sortedAppointments.length > 0) {
      let currentDate = parseISO(sortedAppointments[0].date);
      const lastDate = parseISO(sortedAppointments[sortedAppointments.length-1].date);

      while(currentDate <= lastDate) {
        allMonths.add(format(currentDate, "MMM yyyy"));
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    // Ensure all months in the range are present, even with 0 appointments
    const fullData = Array.from(allMonths).map(month => ({
      name: month,
      appointments: data[month] || 0,
    }));
    
    // Sort final data chronologically
    return fullData.sort((a,b) => {
        const [aMonth, aYear] = a.name.split(" ");
        const [bMonth, bYear] = b.name.split(" ");
        if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
        return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
    });

  }, [appointments]);

  function onSubmit(data: PatientFormValues) {
    if (!user || !patient) {
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
    
    const updatedPatient: Patient = {
        ...patient,
        ...patientData
    };

    updatePatient(updatedPatient);
    setPatient(updatedPatient); // Update state locally
    setIsEditing(false);
    toast({
        title: "Patient Updated",
        description: `${data.name}'s record has been updated successfully.`,
    });
  }

  const handleDeletePatient = () => {
    if (!user || !patient) {
        toast({ title: "Error", description: "No patient selected.", variant: "destructive" });
        return;
    }
     if (window.confirm(`Are you sure you want to delete ${patient.name}'s record? This will also remove all associated appointments and prescriptions and cannot be undone.`)) {
      deletePatient(patient.id);
      toast({
        title: "Patient Deleted",
        description: `${patient.name}'s record has been deleted.`,
        variant: "destructive",
      });
      router.push('/patients');
    }
  }

  const handleDeleteAnalysis = (analysisId: string) => {
    if (window.confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      deleteAnalysis(analysisId);
      fetchAnalyses();
      toast({
        title: "Analysis Deleted",
        description: "The medical analysis has been removed.",
        variant: "destructive",
      });
    }
  }
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    if(patient) {
        form.reset({
            ...patient,
            dateOfBirth: parseISO(patient.dateOfBirth),
            medicalHistory: patient.medicalHistory.join("\n"),
        });
    }
  }
  
  if (isLoading || !patient) {
    return <LoadingSpinner fullScreen message="Loading patient data..." />
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/patients')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient List
            </Button>
            <Button variant="destructive" onClick={handleDeletePatient}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Patient Record
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl font-semibold"><User className="mr-3 h-5 w-5" />Patient Details</CardTitle>
                        <CardDescription>{isEditing ? "Edit patient's information." : "View patient's demographic and medical information."}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., John Doe" {...field} disabled={!isEditing} />
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
                                <FormItem>
                                  <FormLabel>Date of Birth</FormLabel>
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
                                        captionLayout="dropdown-buttons"
                                        fromYear={1900}
                                        toYear={new Date().getFullYear()}
                                        classNames={{
                                          caption_label: "hidden",
                                        }}
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
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={!isEditing}>
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
                                    <Input placeholder="e.g., john.doe@example.com | (555) 123-4567" {...field} disabled={!isEditing}/>
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
                                    <Input placeholder="e.g., 123 Main St, Anytown, USA" {...field} disabled={!isEditing}/>
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
                                    <Textarea placeholder="e.g., Hypertension\nType 2 Diabetes\nAsthma" {...field} rows={4} disabled={!isEditing}/>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {isEditing ? (
                                <div className="flex gap-2 w-full pt-2">
                                    <Button type="button" variant="outline" className="w-full" onClick={handleCancelEdit}>Cancel</Button>
                                    <Button type="submit" className="w-full">
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </Button>
                                </div>
                            ) : (
                                <Button type="button" onClick={() => setIsEditing(true)} className="w-full pt-2">
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Edit Patient Details
                                </Button>
                            )}
                          </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                  <TabsTrigger value="analyses">Analyses</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl font-semibold">Progression Tracker</CardTitle>
                            <CardDescription>Patient's appointment frequency over time.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px] p-2">
                            {appointmentHistoryChartData.length > 0 ? (
                                <PatientAppointmentsChart data={appointmentHistoryChartData} />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-center text-muted-foreground">No appointment history to display chart.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appointments">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl font-semibold"><CalendarDays className="mr-3 h-5 w-5" />Appointments</CardTitle>
                            <CardDescription>Upcoming and past appointments for {patient.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {appointments.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Doctor</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {appointments.map(appt => (
                                            <TableRow key={appt.id}>
                                                <TableCell>{format(parseISO(appt.date), "PP")}</TableCell>
                                                <TableCell>{appt.time}</TableCell>
                                                <TableCell>{appt.doctorName}</TableCell>
                                                <TableCell>{appt.reason}</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    appt.status === "Scheduled" && "bg-blue-100 text-blue-700",
                                                    appt.status === "Completed" && "bg-green-100 text-green-700",
                                                    appt.status === "Cancelled" && "bg-red-100 text-red-700"
                                                    )}>
                                                    {appt.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                          ) : (
                              <p className="text-center text-muted-foreground py-8">No appointments found for this patient.</p>
                          )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="prescriptions">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl font-semibold"><FileText className="mr-3 h-5 w-5" />Prescription History</CardTitle>
                            <CardDescription>Medications prescribed to {patient.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {prescriptions.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Medication</TableHead>
                                            <TableHead>Dosage</TableHead>
                                            <TableHead>Frequency</TableHead>
                                            <TableHead>Prescribing Doctor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {prescriptions.map(presc => (
                                            <TableRow key={presc.id}>
                                                <TableCell>{format(parseISO(presc.date), "PP")}</TableCell>
                                                <TableCell>{presc.medication}</TableCell>
                                                <TableCell>{presc.dosage}</TableCell>
                                                <TableCell>{presc.frequency}</TableCell>
                                                <TableCell>{presc.doctorName}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                              <p className="text-center text-muted-foreground py-8">No prescription history found for this patient.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analyses">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl font-semibold"><BrainCircuit className="mr-3 h-5 w-5" />Medical Analyses</CardTitle>
                            <CardDescription>AI-powered diagnostic analyses for {patient.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {analyses.length > 0 ? (
                                <div className="space-y-4">
                                    {analyses.map(analysis => (
                                        <div key={analysis.id} className="border rounded-lg p-3 flex justify-between items-center">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <div className="flex-grow cursor-pointer hover:bg-muted -m-3 p-3 rounded-l-lg transition-colors">
                                                        <div className="font-medium">{analysis.imagingModality} Analysis</div>
                                                        <div className="text-sm text-muted-foreground">{format(parseISO(analysis.createdAt), "PPP p")}</div>
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-4xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Analysis from {format(parseISO(analysis.createdAt), "PPP p")}</DialogTitle>
                                                        <DialogDescription>
                                                            Modality: {analysis.imagingModality} | Patient Context: {analysis.patientDetails}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
                                                    {isDentalResult(analysis.analysisOutput) && (
                                                        <div className="space-y-6">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <Label>Original Image:</Label>
                                                                    <div className="mt-2 rounded-md border overflow-hidden aspect-video relative bg-muted">
                                                                        <Image src={analysis.originalImageDataUri} alt="Original x-ray" fill style={{ objectFit: "contain" }} />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <Label>AI Highlighted Image:</Label>
                                                                    <div className="mt-2 rounded-md border overflow-hidden aspect-video relative bg-muted">
                                                                        <Image src={analysis.analysisOutput.highlightedImageDataUri} alt="AI highlighted x-ray" fill style={{ objectFit: "contain" }} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-semibold flex items-center mb-2"><ShieldCheck className="mr-2 h-5 w-5 text-primary" />Confidence Score</h3>
                                                                <Badge 
                                                                    variant={analysis.analysisOutput.confidenceScore === 'High' ? 'default' : analysis.analysisOutput.confidenceScore === 'Medium' ? 'secondary' : 'destructive'}
                                                                    className="text-base"
                                                                >
                                                                    {analysis.analysisOutput.confidenceScore}
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-semibold flex items-center mb-2"><FileText className="mr-2 h-5 w-5 text-primary" />AI Summary</h3>
                                                                <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{analysis.analysisOutput.summary}</p>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-semibold flex items-center mb-2"><FileCheck className="mr-2 h-5 w-5 text-primary" />Detailed Findings</h3>
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>Finding Description</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {analysis.analysisOutput.findings.map((finding, index) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell>{finding.description}</TableCell>
                                                                        </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {isStandardResult(analysis.analysisOutput) && (
                                                        <div className="space-y-6">
                                                            <div>
                                                                <Label>Original Image:</Label>
                                                                <div className="mt-2 rounded-md border overflow-hidden aspect-video relative bg-muted">
                                                                    <Image src={analysis.originalImageDataUri} alt="Original medical image" fill style={{ objectFit: "contain" }} />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-semibold flex items-center mb-2"><FileText className="mr-2 h-5 w-5 text-primary" />Diagnosis Summary</h3>
                                                                <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{analysis.analysisOutput.diagnosisSummary}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="ml-2 flex-shrink-0"
                                                onClick={() => handleDeleteAnalysis(analysis.id)}
                                                aria-label="Delete analysis"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                               <p className="text-center text-muted-foreground py-8">No medical analyses found for this patient.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
              </Tabs>
            </div>
        </div>
    </div>
  );
}

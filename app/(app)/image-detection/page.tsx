
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import { UploadCloud, Bot, FileText, Activity, Thermometer, Mic, MicOff, FileCheck, Save, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateDiagnosisSummary, type GenerateDiagnosisSummaryOutput } from "@/ai/flows/generate-diagnosis-summary";
import { dentalXrayAnalysis, type DentalXrayAnalysisOutput } from "@/ai/flows/dental-xray-analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { getPatients, addAnalysis } from "@/lib/storage";
import type { Patient } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";


const imageDetectionSchema = z.object({
  diagnosticInput: z.string().min(1, "Diagnostic input is required."),
  imagingModality: z.string().min(1, "Imaging modality is required."),
  medicalImage: z.custom<File>((val) => val instanceof File, "Please upload an image file.")
    .refine(file => file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
    .refine(file => ["image/jpeg", "image/png", "image/webp"].includes(file.type), ".jpg, .png, .webp files are accepted."),
});

type ImageDetectionFormValues = z.infer<typeof imageDetectionSchema>;

// Speech Recognition setup
const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;


export default function ImageDetectionPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [imageDataUri, setImageDataUri] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<GenerateDiagnosisSummaryOutput | DentalXrayAnalysisOutput | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [savePatientId, setSavePatientId] = React.useState<string>("");

  const [isListening, setIsListening] = React.useState(false);
  const [activeField, setActiveField] = React.useState<"diagnosticInput" | null>(null);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  const form = useForm<ImageDetectionFormValues>({
    resolver: zodResolver(imageDetectionSchema),
    defaultValues: {
      diagnosticInput: "",
      imagingModality: "",
    },
  });

  React.useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        if (activeField) {
          const currentVal = form.getValues(activeField);
          const newVal = (currentVal ? currentVal + " " : "") + finalTranscript;
          form.setValue(activeField, newVal.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        toast({ title: "Voice Error", description: event.error, variant: "destructive" });
        setIsListening(false);
        setActiveField(null);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setActiveField(null);
      };

      recognitionRef.current = recognition;
    }
  }, [activeField, form, toast]);


  const toggleListening = (fieldName: "diagnosticInput") => {
    if (!SpeechRecognition) {
      toast({ title: "Unsupported Browser", description: "Voice dictation is not supported by your browser.", variant: "destructive" });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setActiveField(null);
    } else {
      setActiveField(fieldName);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };


  React.useEffect(() => {
    if (user) {
      setPatients(getPatients(user.id));
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("medicalImage", file);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setAiResult(null); 
    }
  };

  const handlePatientSelect = (patientName: string) => {
    const patient = patients.find(p => p.name === patientName);
    if (patient) {
      const details = `Name: ${patient.name}, DOB: ${patient.dateOfBirth}, Gender: ${patient.gender}, Medical History: ${patient.medicalHistory.join(', ')}`;
      form.setValue("diagnosticInput", details);
    }
  };


  async function onSubmit(data: ImageDetectionFormValues) {
    if (!imageDataUri) {
      toast({
        title: "Error",
        description: "Please upload a medical image.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setAiResult(null);
    try {
      let result;
      if (data.imagingModality === 'Dental X-ray') {
          result = await dentalXrayAnalysis({
            photoDataUri: imageDataUri,
            patientDetails: data.diagnosticInput,
          });
      } else {
          result = await generateDiagnosisSummary({
              medicalImageDataUri: imageDataUri,
              patientDetails: data.diagnosticInput,
              imagingModality: data.imagingModality,
          });
      }

      setAiResult(result);
      toast({
        title: "AI Analysis Complete",
        description: "Diagnosis summary has been generated.",
      });
    } catch (error) {
      console.error("AI Diagnosis Error:", error);
      toast({
        title: "AI Analysis Failed",
        description: "Could not generate diagnosis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleSaveAnalysis = () => {
    if (!user || !savePatientId || !aiResult || !imageDataUri) {
        toast({ title: "Error", description: "Patient and analysis result must be present to save.", variant: "destructive" });
        return;
    }
    
    const analysisData = {
        patientId: savePatientId,
        originalImageDataUri: imageDataUri,
        analysisType: isDentalResult(aiResult) ? 'Dental X-ray' : 'Standard',
        analysisOutput: aiResult,
        imagingModality: form.getValues('imagingModality'),
        patientDetails: form.getValues('diagnosticInput'),
    };
    
    addAnalysis(analysisData, user.id);
    toast({ title: "Analysis Saved", description: "The analysis has been saved to the patient's record." });
    setSavePatientId(""); // Reset selection
    // Potentially reset the whole form here if desired
    handleReset();
  };

  const isDentalResult = (result: any): result is DentalXrayAnalysisOutput => {
      return result && 'highlightedImageDataUri' in result;
  }
  const isStandardResult = (result: any): result is GenerateDiagnosisSummaryOutput => {
      return result && 'diagnosisSummary' in result;
  }

  const handleReset = () => {
    setAiResult(null);
    setImageDataUri(null);
    setFileName(null);
    form.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">AI Medical Image Detection</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upload Image & Details</CardTitle>
            <CardDescription>Provide the medical image and necessary information for AI analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="medicalImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Image</FormLabel>
                      <FormControl>
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <UploadCloud className="mr-2 h-4 w-4" />
                            {fileName || "Click to upload image"}
                          </Button>
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                    <FormLabel>Select Patient (Optional)</FormLabel>
                    <Select onValueChange={handlePatientSelect}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a patient to prefill details" />
                        </SelectTrigger>
                        <SelectContent>
                        {patients.length === 0 && <SelectItem value="no-patients-placeholder" disabled>No patients available</SelectItem>}
                        {patients.map(patient => (
                            <SelectItem key={patient.id} value={patient.name}>{patient.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </FormItem>
                
                <FormField
                  control={form.control}
                  name="diagnosticInput"
                  render={({ field }) => (
                    <FormItem>
                       <div className="flex justify-between items-center">
                        <FormLabel>Diagnostic Input</FormLabel>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleListening("diagnosticInput")}
                            className={cn("h-7 w-7", isListening && activeField === 'diagnosticInput' && "text-destructive")}
                            aria-label="Use microphone to dictate patient details"
                            >
                            {isListening && activeField === 'diagnosticInput' ? <MicOff /> : <Mic />}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea placeholder="e.g., John Doe, 45 Male, history of chest pain... or click the mic to dictate" {...field} />
                      </FormControl>
                      <FormDescription>Provide relevant patient context.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imagingModality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imaging Modality</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select modality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="X-ray">X-ray</SelectItem>
                          <SelectItem value="Dental X-ray">Dental X-ray</SelectItem>
                          <SelectItem value="MRI">MRI</SelectItem>
                          <SelectItem value="CT Scan">CT Scan</SelectItem>
                          <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading || !imageDataUri} className="w-full">
                  {isLoading ? "Analyzing..." : "Start AI Analysis"} <Bot className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
            <CardDescription>View the uploaded image and AI-generated diagnostic insights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-[250px] w-full" />
                    <Skeleton className="h-[250px] w-full" />
                </div>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}

            {!isLoading && aiResult && isDentalResult(aiResult) && (
                 <div className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Original X-ray:</Label>
                            <div className="mt-2 rounded-md border overflow-hidden aspect-video relative bg-muted">
                                <Image src={imageDataUri!} alt="Original dental x-ray" fill style={{ objectFit: "contain" }} data-ai-hint="dental xray" />
                            </div>
                        </div>
                        <div>
                            <Label>AI Highlighted X-ray:</Label>
                            <div className="mt-2 rounded-md border overflow-hidden aspect-video relative bg-muted">
                                <Image src={aiResult.highlightedImageDataUri} alt="AI highlighted dental x-ray" fill style={{ objectFit: "contain" }} data-ai-hint="highlighted xray" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold flex items-center mb-2"><ShieldCheck className="mr-2 h-5 w-5 text-primary" />Confidence Score</h3>
                         <Badge 
                            variant={aiResult.confidenceScore === 'High' ? 'default' : aiResult.confidenceScore === 'Medium' ? 'secondary' : 'destructive'}
                            className="text-base"
                         >
                            {aiResult.confidenceScore}
                        </Badge>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold flex items-center mb-2"><FileText className="mr-2 h-5 w-5 text-primary" />AI Analysis Summary</h3>
                        <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{aiResult.summary}</p>
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
                                {aiResult.findings.map((finding, index) => (
                                <TableRow key={index}>
                                    <TableCell>{finding.description}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                 </div>
            )}
            
            {!isLoading && aiResult && isStandardResult(aiResult) && (
              <>
                 {imageDataUri && (
                    <div>
                        <Label>Uploaded Image:</Label>
                        <div className="mt-2 rounded-md border overflow-hidden aspect-video relative bg-muted">
                        <Image src={imageDataUri} alt="Uploaded medical image" fill style={{ objectFit: "contain" }} data-ai-hint="medical image" />
                        </div>
                    </div>
                )}
                <div className="space-y-6 pt-4">
                    <div>
                    <h3 className="text-lg font-semibold flex items-center mb-2"><FileText className="mr-2 h-5 w-5 text-primary" />Diagnosis Summary</h3>
                    <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{aiResult.diagnosisSummary}</p>
                    </div>
                    <div>
                    <h3 className="text-lg font-semibold flex items-center mb-2"><Thermometer className="mr-2 h-5 w-5 text-primary" />Potential Conditions</h3>
                    <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{aiResult.potentialConditions}</p>
                    </div>
                    <div>
                    <h3 className="text-lg font-semibold flex items-center mb-2"><Activity className="mr-2 h-5 w-5 text-primary" />Relevant Findings</h3>
                    <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{aiResult.relevantFindings}</p>
                    </div>
                </div>
              </>
            )}

            {!imageDataUri && !isLoading && !aiResult && (
              <div className="text-center text-muted-foreground py-10">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Upload an image and provide details to start analysis.</p>
              </div>
            )}
          </CardContent>
          {aiResult && !isLoading && (
             <CardFooter className="flex justify-between">
              <Dialog>
                <DialogTrigger asChild>
                    <Button><Save className="mr-2 h-4 w-4" /> Save to Patient Record</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Patient</DialogTitle>
                        <DialogDescription>Choose a patient to associate with this analysis.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Select onValueChange={setSavePatientId} value={savePatientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a patient..." />
                            </SelectTrigger>
                            <SelectContent>
                                {patients.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setSavePatientId("")}>Cancel</Button>
                        <Button onClick={handleSaveAnalysis} disabled={!savePatientId}>Save Analysis</Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handleReset}>
                Start New Analysis
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

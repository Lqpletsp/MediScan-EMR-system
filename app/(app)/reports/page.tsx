
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppointments, getPatients } from "@/lib/storage";
import type { ReportData } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

const AppointmentsChart = dynamic(
  () => import("@/components/charts/AppointmentsChart"),
  { 
    ssr: false,
    loading: () => <div className="h-[300px] w-full flex items-center justify-center"><Skeleton className="h-[280px] w-full" /></div>
  }
);
const PatientDemographicsChart = dynamic(
  () => import("@/components/charts/PatientDemographicsChart"),
  { 
    ssr: false,
    loading: () => <div className="h-[300px] w-full flex items-center justify-center"><Skeleton className="h-[280px] w-full" /></div>
  }
);


export default function ReportsPage() {
  const { user } = useAuth();
  const [reportData, setReportData] = React.useState<ReportData | null>(null);

  React.useEffect(() => {
    if (!user) return;

    const appointments = getAppointments(user.id);
    const patients = getPatients(user.id);

    const appointmentsByMonth: { [key: string]: number } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const monthKey = format(d, "MMM");
        appointmentsByMonth[monthKey] = 0;
    }

    appointments.forEach(appt => {
      const monthKey = format(parseISO(appt.date), "MMM");
      if (appointmentsByMonth.hasOwnProperty(monthKey)) {
        appointmentsByMonth[monthKey]++;
      } else {
        const apptDate = parseISO(appt.date);
        if (apptDate.getFullYear() === currentYear || (apptDate.getFullYear() === currentYear -1 && apptDate.getMonth() > 5) ) {
             appointmentsByMonth[monthKey] = (appointmentsByMonth[monthKey] || 0) + 1;
        }
      }
    });

    const appointmentsPerMonthData = Object.entries(appointmentsByMonth)
        .map(([month, count]) => ({ month, count }))
        .sort((a,b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month));

    const demographics: { [key: string]: number } = { Male: 0, Female: 0, Other: 0 };
    patients.forEach(patient => {
      if (demographics.hasOwnProperty(patient.gender)) {
        demographics[patient.gender]++;
      }
    });
    const patientDemographicsData = Object.entries(demographics).map(([gender, count]) => ({
      gender,
      count,
      fill: gender === 'Male' ? "hsl(var(--chart-1))" : gender === 'Female' ? "hsl(var(--chart-2))" : "hsl(var(--chart-3))"
    }));

    setReportData({
      appointmentsPerMonth: appointmentsPerMonthData,
      patientDemographics: patientDemographicsData,
    });
  }, [user]);

  
  if (!reportData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-headline font-semibold">Practice Reports</h1>
        <p className="text-muted-foreground">Loading report data...</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointments Per Month</CardTitle>
              <CardDescription>Total number of appointments scheduled each month (recent history).</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Patient Demographics</CardTitle>
              <CardDescription>Distribution of patients by gender.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">Practice Reports</h1>
      <p className="text-muted-foreground">
        Summary reports for practice analysis based on current data.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointments Per Month</CardTitle>
            <CardDescription>Total number of appointments scheduled each month (recent history).</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.appointmentsPerMonth.reduce((sum, item) => sum + item.count, 0) > 0 ? (
              <AppointmentsChart data={reportData.appointmentsPerMonth} />
            ) : (
              <p className="text-center text-muted-foreground py-10">No appointment data available to display chart.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Demographics</CardTitle>
            <CardDescription>Distribution of patients by gender.</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.patientDemographics.reduce((sum, item) => sum + item.count, 0) > 0 ? (
              <PatientDemographicsChart data={reportData.patientDemographics} />
            ) : (
              <p className="text-center text-muted-foreground py-10">No patient demographic data available to display chart.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Utilization (Placeholder)</CardTitle>
          <CardDescription>Frequency of different services offered.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Chart data for service utilization will be displayed here once implemented.</p>
        </CardContent>
      </Card>
    </div>
  );
}

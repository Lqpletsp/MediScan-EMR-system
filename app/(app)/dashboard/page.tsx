
"use client";

import * as React from "react";
import Link from "next/link";
import { format, parseISO, isWithinInterval, startOfToday, endOfToday, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPatients, getAppointments } from "@/lib/storage";
import type { Patient, Appointment } from "@/lib/types";
import { Users, CalendarClock, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);

  React.useEffect(() => {
    if (user) {
      setPatients(getPatients(user.id));
      setAppointments(getAppointments(user.id));
    }
  }, [user]);

  const upcomingAppointments = React.useMemo(() => {
    if (!user) return [];
    return appointments
      .filter(app => parseISO(app.date) >= startOfToday() && app.status === 'Scheduled')
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 3);
  }, [appointments, user]);

  const recentPatients = React.useMemo(() => {
    if (!user) return [];
    return patients
      .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())
      .slice(0, 5);
  }, [patients, user]);
  
  const newRecordsToday = React.useMemo(() => {
    if (!user) return 0;
    const todayInterval = { start: startOfToday(), end: endOfToday() };
    const newPatients = patients.filter(p => isWithinInterval(parseISO(p.createdAt), todayInterval)).length;
    const newAppointments = appointments.filter(a => isWithinInterval(parseISO(a.createdAt), todayInterval)).length;
    return newPatients + newAppointments;
  }, [patients, appointments, user]);

  const newPatientsThisMonth = React.useMemo(() => {
    if (!user) return 0;
    const monthInterval = { start: addDays(startOfToday(), -30), end: endOfToday() };
    return patients.filter(p => isWithinInterval(parseISO(p.createdAt), monthInterval)).length;
  }, [patients, user]);

  const upcomingAppointmentsCount = React.useMemo(() => {
    if (!user) return 0;
    const nextWeekInterval = { start: startOfToday(), end: addDays(startOfToday(), 7) };
    return appointments.filter(app => isWithinInterval(parseISO(app.date), nextWeekInterval) && app.status === 'Scheduled').length;
  }, [appointments, user]);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">Patient Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-muted-foreground">
              {newPatientsThisMonth} new this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingAppointmentsCount}
            </div>
            <p className="text-xs text-muted-foreground">In next 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Records Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{newRecordsToday} Entries</div>
            <p className="text-xs text-muted-foreground">Patients & Appointments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your next few scheduled appointments.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAppointments.map((appointment: Appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.patientName}</TableCell>
                      <TableCell>{format(parseISO(appointment.date), "PP")}</TableCell>
                      <TableCell>{appointment.time}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          {/* Link to a specific appointment view could be added later */}
                          <Link href={`/appointments?date=${appointment.date}`}>View on Calendar</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No upcoming appointments.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
            <CardDescription>Patients recently added to the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPatients.length > 0 ? recentPatients.map(patient => (
              <div key={patient.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt={patient.name} data-ai-hint="person avatar" />
                    <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">{patient.contact.split('|')[0].trim()}</p>
                  </div>
                </div>
                <Badge variant={patient.medicalHistory.length > 1 ? "destructive" : "secondary"}>
                  {patient.medicalHistory.length > 1 ? "High Risk" : "Low Risk"}
                </Badge>
              </div>
            )) : (
              <p className="text-muted-foreground">No patients added yet.</p>
            )}
             <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/patients">View All Patients</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, CalendarDays, ScanSearch, FileText, BarChart3, HeartPulse, UsersRound } from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  subItems?: NavItem[];
}

export const APP_NAME = "Vitalens";
export const APP_ICON = HeartPulse;


export const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: '/patients',
    label: 'Patients',
    icon: UsersRound,
  },
  {
    path: '/appointments',
    label: 'Appointments',
    icon: CalendarDays,
  },
  {
    path: '/image-detection',
    label: 'Image Detection',
    icon: ScanSearch,
  },
  {
    path: '/prescriptions',
    label: 'Prescriptions',
    icon: FileText,
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: BarChart3,
  },
];


"use client"; // This layout must be a client component to use hooks

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useAuth } from '@/hooks/useAuth'; 
import { LoadingSpinner } from '@/components/ui/loading-spinner'; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // After loading, if there is no user, redirect to login.
    if (!loading && !user) {
      if (pathname !== '/login' && pathname !== '/signup') {
         router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else {
         router.replace('/login');
      }
    }
  }, [user, loading, router, pathname]);

  // Always show a spinner while the auth state is loading.
  // This ensures the server and initial client render are consistent.
  if (loading) {
    return <LoadingSpinner fullScreen message="Authenticating..." />;
  }

  // After loading, if there's no user, the useEffect will redirect.
  // Show a spinner during this brief period to prevent content flash.
  if (!user) {
    return <LoadingSpinner fullScreen message="Redirecting to login..." />;
  }
  
  const getAvatarFallback = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(' ');
    if (parts.length > 1 && parts[parts.length -1]) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`;
    }
    return name.substring(0, 2);
  };

  // If we have a user, show the main app content.
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen flex flex-col">
          <header className="flex h-16 items-center justify-end border-b bg-card px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.doctorId}</p>
              </div>
               <Avatar>
                  <AvatarImage src="https://placehold.co/40x40.png" alt={user.name} data-ai-hint="doctor avatar" />
                  <AvatarFallback>{getAvatarFallback(user.name)}</AvatarFallback>
                </Avatar>
            </div>
          </header>
          <main className="flex-grow p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

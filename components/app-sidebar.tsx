
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { navItems, APP_NAME, APP_ICON } from '@/config/nav-items';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { useToast } from '@/hooks/use-toast';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter(); // Get router instance
  const { logOut, user } = useAuth(); // Get logOut function and user
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <APP_ICON className="w-8 h-8 text-primary" />
          <h1 className="font-headline text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
            {APP_NAME}
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarTrigger className="md:hidden absolute top-3 right-3" />
      <Separator />
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                className={cn(
                  "w-full justify-start",
                  pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                tooltip={item.label}
                isActive={pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))}
              >
                <Link href={item.path}>
                  <item.icon className="mr-2 h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <Separator />
      {user && ( // Only show footer if user is logged in
        <SidebarFooter className="p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start group-data-[collapsible=icon]:justify-center"
            onClick={handleLogout} // Call handleLogout on click
          >
            <LogOut className="mr-2 h-5 w-5 group-data-[collapsible=icon]:mr-0" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

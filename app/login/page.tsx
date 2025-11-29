
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { APP_ICON, APP_NAME } from "@/config/nav-items";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { AuthFormValues } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const loginSchema = z.object({
  doctorId: z
    .string()
    .min(1, "Doctor ID is required")
    .regex(/^[0-9]+$/, "Doctor ID must contain only numbers."),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const { logIn, user, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      doctorId: "",
      password: "",
    },
  });

  React.useEffect(() => {
    // If a user object exists, they are logged in, so redirect to dashboard.
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  async function onSubmit(values: AuthFormValues) {
    setIsSubmitting(true);
    try {
      await logIn(values);
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting...",
      });
      // The redirect is now handled by the useEffect hook watching for user state change.
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Show a loading screen while auth state is being determined.
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }
  
  // If user is already logged in, the useEffect will redirect.
  // Show a spinner during this brief period.
  if (user) {
     return <LoadingSpinner fullScreen message="Redirecting..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <APP_ICON className="mx-auto h-12 w-12 text-primary" />
          </Link>
          <CardTitle className="text-2xl font-headline">{APP_NAME} - Login</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor ID</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="pr-10"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Log In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Button variant="link" className="p-0 h-auto" asChild>
                    <Link href="/signup">Sign up</Link>
                </Button>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

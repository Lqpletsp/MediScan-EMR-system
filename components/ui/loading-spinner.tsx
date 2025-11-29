
"use client";

import { HeartPulse } from 'lucide-react'; // Using a specific icon to avoid dependency on nav-items
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  message,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const iconSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center text-primary",
    fullScreen && "fixed inset-0 bg-background/80 z-50",
    className
  );

  return (
    <div className={containerClasses}>
      <HeartPulse className={cn("animate-pulse", iconSizeClasses[size])} />
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

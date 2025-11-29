
"use client";
import { useAuth as useAuthContextListener } from "@/context/AuthContext";

/**
 * Custom hook to access authentication context.
 * Provides user, loading state, and auth functions (signUp, logIn, logOut).
 */
export const useAuth = () => {
  return useAuthContextListener();
};

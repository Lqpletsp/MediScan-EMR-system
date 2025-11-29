
"use client";

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  type ReactNode 
} from "react";
import { addUser, findUser } from "@/lib/storage";
import type { AuthFormValues, StoredUser } from '@/lib/types';

interface AuthContextType {
  user: StoredUser | null;
  loading: boolean;
  signUp: (values: AuthFormValues) => Promise<StoredUser>;
  logIn: (values: AuthFormValues) => Promise<StoredUser>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_USER_KEY = 'emr-session-user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On initial load, check sessionStorage for a logged-in user
    try {
        const storedUserJson = sessionStorage.getItem(SESSION_USER_KEY);
        if (storedUserJson) {
            setUser(JSON.parse(storedUserJson));
        }
    } catch (error) {
        console.error("Could not parse user from sessionStorage", error);
        sessionStorage.removeItem(SESSION_USER_KEY);
    } finally {
        setLoading(false);
    }
  }, []);

  const signUp = async (values: AuthFormValues): Promise<StoredUser> => {
    try {
        const newUser = addUser({ doctorId: values.doctorId, password: values.password });
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(newUser));
        setUser(newUser);
        return newUser;
    } catch (error) {
        // Error will be thrown from storage function if user exists
        throw error;
    }
  };

  const logIn = async (values: AuthFormValues): Promise<StoredUser> => {
    const foundUser = findUser({ doctorId: values.doctorId, password: values.password });
    if (foundUser) {
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(foundUser));
        setUser(foundUser);
        return foundUser;
    } else {
        throw new Error("Invalid Doctor ID or password.");
    }
  };

  const logOut = async () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_USER_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

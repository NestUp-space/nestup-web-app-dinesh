"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getUserProfile } from "@/lib/api/auth";
import { isAuthenticated } from "@/lib/api";

interface UserContextProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string | string[]) => boolean; // Added hasPermission
}

interface User {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  profilePicture?: string;
  role?: {
    id: number;
    role: string;
    roleType: string;
  };
  permissions?: string[];
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user after first paint so profile fetch never blocks initial render
  useEffect(() => {
    const PROFILE_FETCH_TIMEOUT_MS = 5000;

    const loadUser = async () => {
      const authenticated = isAuthenticated();

      try {
        if (authenticated) {
          const userData = await Promise.race([
            getUserProfile(),
            new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), PROFILE_FETCH_TIMEOUT_MS)
            ),
          ]);
          if (userData && userData.success && userData.user) {
            setUser(userData.user);
          }
        }
      } catch (error) {
        console.warn("UserContext - Profile load failed or timed out:", error);
        if (authenticated) localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };

    // Defer so first paint is not delayed by this effect running in the same tick
    const id = setTimeout(loadUser, 0);
    return () => clearTimeout(id);
  }, []);

  // Login function to set user and token
  const login = (userData: User, token: string) => {
    localStorage.setItem("token", token);
    console.log('UserContext - login called. UserData received:', userData);
    console.log('UserContext - login called. UserData permissions:', userData?.permissions);
    setUser(userData);
  };

  // Logout function to clear user and token
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // hasPermission function
  const hasPermission = (requiredPermissions: string | string[]): boolean => {
    if (!user || !user.permissions) {
      return false;
    }
    if (typeof requiredPermissions === 'string') {
      return user.permissions.includes(requiredPermissions);
    }
    // If an array of permissions is provided, check if the user has at least one of them (OR logic)
    // To check for ALL permissions (AND logic), use .every() instead of .some()
    return requiredPermissions.some(permission => user.permissions!.includes(permission));
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, isLoading, hasPermission }}>
      {children}
    </UserContext.Provider>
  );
};

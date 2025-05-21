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

  // Load user on initial mount
  useEffect(() => {
    const loadUser = async () => {
      console.log('UserContext - useEffect triggered. Checking authentication status.');
      const token = localStorage.getItem('token');
      console.log('UserContext - Token from localStorage:', token);
      const authenticated = isAuthenticated();
      console.log('UserContext - isAuthenticated() returned:', authenticated);

      if (authenticated) {
        try {
          console.log('UserContext - User is authenticated, attempting to get user profile.');
          const userData = await getUserProfile();
          console.log('UserContext - User profile response:', userData);
          if (userData && userData.success && userData.user) { // Added null check for userData.user
            console.log('UserContext - Setting user. Profile data:', userData.user);
            console.log('UserContext - Permissions from profile data:', userData.user.permissions);
            setUser(userData.user);
          } else {
            console.warn('UserContext - Failed to get user profile or user data is missing. Response:', userData);
            // Optionally clear token if profile fetch fails despite being "authenticated"
            // localStorage.removeItem("token"); 
          }
        } catch (error) {
          console.error("UserContext - Error loading user profile:", error);
          // Clear invalid token if there's an error during fetch
          localStorage.removeItem("token");
        }
      } else {
        console.log('UserContext - User is NOT authenticated. Skipping profile load.');
      }
      setIsLoading(false);
      console.log('UserContext - setIsLoading(false) called.');
    };

    console.log('UserContext - Calling loadUser()');
    loadUser();
    console.log('UserContext - loadUser() call finished.');
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

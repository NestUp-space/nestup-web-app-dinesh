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
      if (isAuthenticated()) {
        try {
          const userData = await getUserProfile();
          if (userData && userData.success) {
            setUser(userData.user);
          }
        } catch (error) {
          console.error("Failed to load user:", error);
          // Clear invalid token
          localStorage.removeItem("token");
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Login function to set user and token
  const login = (userData: User, token: string) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  // Logout function to clear user and token
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

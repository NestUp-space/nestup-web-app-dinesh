"use client";

import { useEffect, useRef, useState } from "react"; // Added useEffect
import { useRouter } from "next/navigation";
import { Button } from "@/components/dashboard/button"; // Updated import
import { Input } from "@/components/dashboard/input";   // Updated import
import { Label } from "@/components/dashboard/label";   // Updated import
import { login as loginApi, register as registerApi } from "@/lib/api/auth";
import { useUser } from "@/context/UserContext";

interface RoleOption {
  value: string;
  label: string;
}

const LoginRegister = () => {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneNumberRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLSelectElement>(null); // Added roleRef

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [roleError, setRoleError] = useState(""); // Added roleError state
  
  const [isRegister, setIsRegister] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [availableExternalRoles, setAvailableExternalRoles] = useState<RoleOption[]>([]); // State for roles
  const [selectedRole, setSelectedRole] = useState<string>(""); // State for selected role

  const router = useRouter();
  const { login: userLogin } = useUser();

  const validateForm = () => {
    let isValid = true;
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setRoleError(""); // Clear role error

    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email address.");
      isValid = false;
    }

    // Password validation
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      isValid = false;
    }

    // Additional validations for registration
    if (isRegister) {
      const name = nameRef.current?.value || "";
      const phoneNumber = phoneNumberRef.current?.value || "";
      const confirmPassword = confirmPasswordRef.current?.value || "";

      // Name validation
      if (!name.trim()) {
        setNameError("Name is required.");
        isValid = false;
      }

      // Phone validation
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        setPhoneError("Phone number must be 10 digits.");
        isValid = false;
      }

      // Confirm password validation
      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match.");
        isValid = false;
      }

      // Role validation
      if (!selectedRole) {
        setRoleError("Please select a role.");
        isValid = false;
      }
    }

    return isValid;
  };

  useEffect(() => {
    if (isRegister) {
      const fetchRoles = async () => {
        setIsLoading(true); // Indicate loading while fetching roles
        try {
          const response = await fetch('/api/roles/registration/external-roles');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.success && Array.isArray(data.roles)) {
            setAvailableExternalRoles(data.roles);
          } else {
            console.error('Failed to parse roles from API:', data.message || 'No roles array');
            setAvailableExternalRoles([]);
            setServerError("Could not load roles for registration. Please try again later.");
          }
        } catch (error) {
          console.error('Could not fetch external roles:', error);
          setAvailableExternalRoles([]);
          setServerError("Could not load roles for registration. Please try again later.");
        } finally {
          setIsLoading(false); // Done loading roles
        }
      };
      fetchRoles();
    } else {
      // Clear roles if switching away from registration form
      setAvailableExternalRoles([]);
      setSelectedRole("");
      setRoleError("");
    }
  }, [isRegister]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isRegister) {
        const registerData = {
          name: nameRef.current?.value || "",
          email: emailRef.current?.value || "",
          phoneNumber: phoneNumberRef.current?.value || "",
          password: passwordRef.current?.value || "",
          roleName: selectedRole // Use selectedRole
        };

        const response = await registerApi(registerData);

        if (response.success) {
          setSuccessMessage("Registration successful! Please log in.");
          setIsRegister(false); // Switch to login form
        } else {
          setServerError(`Registration failed: ${response.message}`);
        }
      } else {
        const loginData = {
          email: emailRef.current?.value || "",
          password: passwordRef.current?.value || ""
        };

        const response = await loginApi(loginData);

        if (response.success && response.token && response.user) {
          // Use the login function from UserContext
          userLogin(response.user, response.token);
          setSuccessMessage("Login successful!");
          router.push("/dashboard");
        } else {
          setServerError(`Login failed: ${response.message}`);
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-lightest-bw py-8">
      <div className="w-full max-w-md p-8 bg-lightest-bw rounded-lg shadow-xl border border-light-bw">
        <h2 className="text-3xl text-theme-color font-bold text-center mb-6">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h2>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {isRegister && (
            <>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  ref={nameRef}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
                {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  ref={phoneNumberRef}
                  placeholder="Enter your 10-digit phone number"
                  className="mt-1"
                />
                {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
              </div>
              <div>
                <Label htmlFor="role">Select Your Role</Label>
                <select
                  id="role"
                  ref={roleRef}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  onChange={(e) => setSelectedRole(e.target.value)}
                  value={selectedRole}
                  disabled={isLoading || availableExternalRoles.length === 0}
                >
                  <option value="" disabled>-- Select a Role --</option>
                  {availableExternalRoles.length === 0 && isRegister && !isLoading && (
                    <option value="" disabled>No roles available</option>
                  )}
                  {availableExternalRoles.map(roleOption => (
                    <option key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </option>
                  ))}
                </select>
                {roleError && <p className="text-red-500 text-xs mt-1">{roleError}</p>}
              </div>
            </>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              ref={emailRef}
              placeholder="Enter your email"
              className="mt-1"
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              ref={passwordRef}
              placeholder="Enter your password"
              className="mt-1"
            />
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          </div>
          {isRegister && (
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                ref={confirmPasswordRef}
                placeholder="Confirm your password"
                className="mt-1"
              />
              {confirmPasswordError && <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>}
            </div>
          )}
          {serverError && <p className="text-red-500 text-sm text-center">{serverError}</p>}
          {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : (isRegister ? "Register" : "Login")}
          </Button>
        </form>
        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => {
              setIsRegister(!isRegister);
              setServerError("");
              setSuccessMessage("");
            }}
            disabled={isLoading}
            className="text-sm"
          >
            {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;

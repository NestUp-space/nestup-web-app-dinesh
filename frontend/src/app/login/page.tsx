"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/dashboard/button";
import { Input } from "@/components/dashboard/input";
import { Label } from "@/components/dashboard/label";
import { login as loginApi, register as registerApi } from "@/lib/api/auth";
import { useUser } from "@/context/UserContext";
import Navbar from "@/components/landing-page/Navbar";
import { Footer } from "@/components/landing-page/Footer";

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
  const roleRef = useRef<HTMLSelectElement>(null);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [roleError, setRoleError] = useState("");
  
  const [isRegister, setIsRegister] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [availableExternalRoles, setAvailableExternalRoles] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const router = useRouter();
  const { login: userLogin } = useUser();

  const validateForm = () => {
    let isValid = true;
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setRoleError("");

    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email address.");
      isValid = false;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      isValid = false;
    }

    if (isRegister) {
      const name = nameRef.current?.value || "";
      const phoneNumber = phoneNumberRef.current?.value || "";
      const confirmPassword = confirmPasswordRef.current?.value || "";

      if (!name.trim()) {
        setNameError("Name is required.");
        isValid = false;
      }

      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        setPhoneError("Phone number must be 10 digits.");
        isValid = false;
      }

      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match.");
        isValid = false;
      }

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
        setIsLoading(true);
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
          setIsLoading(false);
        }
      };
      fetchRoles();
    } else {
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
          roleName: selectedRole
        };

        const response = await registerApi(registerData);

        if (response.success) {
          setSuccessMessage("Registration successful! Please log in.");
          setIsRegister(false);
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
    <section>
      <div className="h-24 top-0 fixed bg-white z-50">
         <Navbar />
      </div>
      <div className="min-h-screen flex items-center justify-center bg-neutral-light py-24 mt-24 w-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl mx-auto bg-white rounded-dls-lg shadow-lg border border-neutral-light overflow-hidden">
          {/* Left Column: Value Proposition, Trust Indicators, Visuals */}
          <div className="p-8 bg-lighter-bg text-dark-text flex flex-col justify-center items-center text-center font-body">
            <div className="login-hero mb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-inter font-bold mb-2 leading-tight text-theme-color">Welcome to Your Modular Manufacturing Hub</h1>
              <p className="text-lg opacity-100">Where 30 years of craftsmanship meets AI precision</p>
              
              <div className="stats-bar mt-6 grid grid-cols-3 gap-4 w-full max-w-xs">
                <div className="stat">
                  <span className="number text-3xl font-bold text-dark-text">14</span>
                  <span className="label block text-sm opacity-100">Days Delivery</span>
                </div>
                <div className="stat">
                  <span className="number text-3xl font-bold text-dark-text">12K+</span>
                  <span className="label block text-sm opacity-100">Units Delivered</span>
                </div>
                <div className="stat">
                  <span className="number text-3xl font-bold text-dark-text">99%</span>
                  <span className="label block text-sm opacity-100">Quality Score</span>
                </div>
              </div>
            </div>

            <div className="mb-8 text-left w-full max-w-sm">
              <h3 className="text-2xl font-inter font-semibold mb-4 text-dark-text">Featured Capabilities:</h3>
              <ul className="space-y-2">
                <li><span className="font-bold text-neutral-dark">🔧 DESIGN:</span> 3D modular modeling, plank by plank</li>
                <li><span className="font-bold text-neutral-dark">📏 MEASURE:</span> Advanced laser measurement technology</li>
                <li><span className="font-bold text-neutral-dark">🏭 MANUFACTURE:</span> Precision manufacturing</li>
                <li><span className="font-bold text-neutral-dark">🚚 DELIVER:</span> Complete installation in 14 days</li>
              </ul>
            </div>

            <div className="mb-8 text-left w-full max-w-sm">
              <h3 className="text-2xl font-inter font-semibold mb-4 text-dark-text">Customer Success Story:</h3>
              <p className="italic text-lg opacity-100">"Father and Son combo brings you the 30 yrs experience with a tech enabled automation experience. Great experience meeting the next gen Co-founder Vamshi, his attention to detail gives clear picture to the customer."</p>
            </div>

            <div className="text-left w-full max-w-sm">
              <h3 className="text-2xl font-inter font-semibold mb-4 text-dark-text">Quick Benefits:</h3>
              <ul className="space-y-2">
                <li>✓ End-to-end project management</li>
                <li>✓ Transparent pricing - no hidden costs</li>
                <li>✓ Machine precision finishing</li>
                <li>✓ Real-time project updates</li>
                <li>✓ 30+ years of craftsmanship experience</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Login/Register Form */}
          <div className="p-8 flex flex-col justify-center font-body">
            <h2 className="text-3xl text-theme-color font-inter font-bold text-center mb-6">
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
                      className="mt-1 border-gray-300 focus:border-theme-color focus:ring-theme-color"
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
                      className="mt-1 border-gray-300 focus:border-theme-color focus:ring-theme-color"
                    />
                    {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                  </div>
                  <div>
                    <Label htmlFor="role">Select Your Role</Label>
                    <select
                      id="role"
                      ref={roleRef}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-theme-color focus:border-theme-color sm:text-sm"
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
                  className="mt-1 border-gray-300 focus:border-theme-color focus:ring-theme-color"
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
                  className="mt-1 border-gray-300 focus:border-theme-color focus:ring-theme-color"
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
                    className="mt-1 border-gray-300 focus:border-theme-color focus:ring-theme-color"
                  />
                  {confirmPasswordError && <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>}
                </div>
              )}
              {serverError && <p className="text-red-500 text-sm text-center">{serverError}</p>}
              {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}
              <Button 
                type="submit" 
                className="w-full bg-primary-orange hover:bg-primary-orange/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : (isRegister ? "Register" : "Access My Dashboard")}
              </Button>
            </form>
            <div className="text-center mt-4">
              <Button
                variant="link"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setServerError("");
                  setSuccessMessage("");
                }}
                disabled={isLoading}
                className="text-sm text-theme-color hover:text-theme-color/90"
              >
                {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
              </Button>
            </div>
            <div className="text-center mt-2">
              <Button variant="link" className="text-sm text-theme-color hover:text-theme-color/90">
                Forgot Password?
              </Button>
            </div>
            <div className="text-center mt-4">
              <Button 
                variant="outline" 
                className="w-full border-theme-color text-theme-color hover:bg-primary-orange/10"
                disabled={isLoading}
              >
                Login with Google
              </Button>
            </div>
            <div className="text-center mt-6 text-sm text-gray-600">
              <p>
                <span className="font-bold text-theme-color">Precision Manufacturing</span> | <span className="font-bold text-theme-color">14-Day Guarantee</span>
              </p>
              <p className="mt-2">
                Your data is secured with SSL encryption. <a href="#" className="underline text-theme-color">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </section>
  );
};

export default LoginRegister;

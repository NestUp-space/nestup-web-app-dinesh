"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CTAButton } from "@components/landing-page/CTAButton";
import { login as loginApi, register as registerApi } from "@/lib/api/auth";
import { useUser } from "@/context/UserContext";

const LoginRegister = () => {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneNumberRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login: userLogin } = useUser();

  const validateForm = () => {
    let isValid = true;
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");

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
    }

    return isValid;
  };

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
          roleName: "client"
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
    <div className="flex justify-center items-center min-h-screen bg-gray-100 py-8">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl text-theme-primary font-bold text-center mb-4">
          {isRegister ? "Register" : "Login"}
        </h2>
        <form onSubmit={handleFormSubmit}>
          {isRegister && (
            <>
              <div className="mb-4">
                <label className="block text-theme-secondary font-bold mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                  ref={nameRef}
                  placeholder="Enter your full name"
                />
                {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-theme-secondary font-bold mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                  ref={phoneNumberRef}
                  placeholder="Enter your 10-digit phone number"
                />
                {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
              </div>
            </>
          )}
          <div className="mb-4">
            <label className="block text-theme-secondary font-bold mb-2">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
              ref={emailRef}
              placeholder="Enter your email"
            />
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-theme-secondary font-bold mb-2">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
              ref={passwordRef}
              placeholder="Enter your password"
            />
            {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
          </div>
          {isRegister && (
            <div className="mb-4">
              <label className="block text-theme-secondary font-bold mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                ref={confirmPasswordRef}
                placeholder="Confirm your password"
              />
              {confirmPasswordError && <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>}
            </div>
          )}
          {serverError && <p className="text-red-500 text-sm mb-4">{serverError}</p>}
          {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}
          <div className="text-center">
            <CTAButton 
              type="submit" 
              text={isLoading ? "Processing..." : (isRegister ? "Register" : "Login")} 
              disabled={isLoading}
            />
          </div>
        </form>
        <div className="text-center mt-4">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setServerError("");
              setSuccessMessage("");
            }}
            className="text-theme-primary hover:underline"
            disabled={isLoading}
          >
            {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;

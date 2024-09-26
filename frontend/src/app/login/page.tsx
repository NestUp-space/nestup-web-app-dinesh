"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CTAButton } from "@components/CTAButton";

const LoginRegister = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email address.");
      return;
    } else {
      setEmailError("");
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    } else {
      setPasswordError("");
    }

    if (isRegister) {
      const confirmPassword = confirmPasswordRef.current?.value || "";
      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match.");
        return;
      } else {
        setConfirmPasswordError("");
      }

      const response = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role: "client" }),
      });

      if (response.ok) {
        setSuccessMessage("Registration successful!");
        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        setServerError(`Registration failed: ${errorData.message}`);
      }
    } else {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { token } = await response.json(); // Extract token from response
        localStorage.setItem("token", token); // Store token in local storage
        setSuccessMessage("Login successful!");
        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        setServerError(`Login failed: ${errorData.message}`);
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl text-theme-primary font-bold text-center mb-4">
          {isRegister ? "Register" : "Login"}
        </h2>
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label className="block text-theme-secondary font-bold mb-2">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
              ref={emailRef}
              placeholder="Enter your email"
            />
            {emailError && <p className="text-theme-error">{emailError}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-theme-secondary font-bold mb-2">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
              ref={passwordRef}
              placeholder="Enter your password"
            />
            {passwordError && <p className="text-theme-error">{passwordError}</p>}
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
              {confirmPasswordError && <p className="text-theme-error">{confirmPasswordError}</p>}
            </div>
          )}
          {serverError && <p className="text-theme-error">{serverError}</p>}
          {successMessage && <p className="text-theme-success">{successMessage}</p>}
          <div className="text-center">
            <CTAButton type="submit" text={isRegister ? "Register" : "Login"} />
          </div>
        </form>
        <div className="text-center mt-4">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-theme-primary hover:underline"
          >
            {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;

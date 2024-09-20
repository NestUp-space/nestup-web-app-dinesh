"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CTAButton } from "@components/CTAButton";

const SignInSignUp = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const router = useRouter();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (isSignUp) {
      const confirmPassword = confirmPasswordRef.current?.value || "";
      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match.");
        return;
      } else {
        setConfirmPasswordError("");
      }
      // Perform sign-up logic here
      // Example: await signUpUser(email, password);
    } else {
      // Perform sign-in logic here
      // Example: await signInUser(email, password);
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl text-theme-primary font-bold text-center mb-4">
          {isSignUp ? "Sign Up" : "Sign In"}
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
          {isSignUp && (
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
          <div className="text-center">
            <CTAButton type="submit" text={isSignUp ? "Sign Up" : "Sign In"} />
          </div>
        </form>
        <div className="text-center mt-4">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-theme-primary hover:underline"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignInSignUp;
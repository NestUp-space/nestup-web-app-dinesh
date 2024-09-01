import React from "react";

interface CTAButtonProps {
  text: string;
  type?: "button" | "submit" | "reset"; // Optional type prop
}

export function CTAButton({ text, type = "button" }: CTAButtonProps) {
  return (
    <button
      type={type}
      className="CTA_button bg-theme-dark text-white rounded px-4 py-2 m-2 hover:bg-orange-500 transition-colors"
    >
      {text}
    </button>
  );
}

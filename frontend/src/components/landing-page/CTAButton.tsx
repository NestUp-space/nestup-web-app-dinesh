import React from "react";

interface CTAButtonProps {
  text: string;
  type?: "button" | "submit" | "reset"; // Optional type prop
  onClick?: () => void; // Optional onClick handler
  className?: string; // Optional className prop for custom styles
}

export function CTAButton({ text, type = "button", onClick, className }: CTAButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`CTA_button bg-theme-dark text-white rounded px-4 py-2 m-2 hover:bg-orange-500 transition-colors ${className}`}
    >
      {text}
    </button>
  );
}

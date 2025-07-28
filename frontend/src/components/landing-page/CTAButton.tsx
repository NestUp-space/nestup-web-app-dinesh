import React from "react";

export interface CTAButtonProps {
  text: string;
  type?: "button" | "submit" | "reset"; // Optional type prop
  onClick?: () => void; // Optional onClick handler
  className?: string; // Optional className prop for custom styles
  disabled?: boolean; // Optional disabled prop
}

export function CTAButton({ text, type = "button", onClick, className, disabled = false }: CTAButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`CTA_button bg-primary-orange text-white rounded px-4 py-2 m-2 hover:bg-orange-500 transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {text}
    </button>
  );
}

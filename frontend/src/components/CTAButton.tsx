import React from "react";

interface CTAButtonProps {
  text: string;
}

export function CTAButton({ text }: CTAButtonProps) {
  return (
    <button className="CTA_button bg-gray-900 text-white rounded px-4 py-2 m-2 hover:bg-orange-500 transition-colors">
      {text}
    </button>
  );
}

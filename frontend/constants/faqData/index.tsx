// faqData.tsx

import React from 'react';

interface FAQ {
  question: string;
  answer: JSX.Element;
}

export const faqData: FAQ[] = [
  {
    question: "What is your process?",
    answer: (
      <>
        The process consists of 4 stages{" "}
        <a href="/process" className="text-theme-color underline">
          Know more
        </a>
        .
      </>
    ),
  },
  {
    question: "What is your pricing structure?",
    answer: (
      <>
        From Site measurement to Installation in 14 working days at ₹320 per sqft
      </>
    ),
  },
  // Add more FAQs as needed
];

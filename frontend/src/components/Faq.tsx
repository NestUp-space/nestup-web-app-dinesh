"use client"; // Ensure this component works as a Client Component in Next.js

import React, { useState } from "react";
import { faqData } from "@constants/faqData";

const FAQ = () => {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const toggleExpand = (index: number) => {
    setExpandedIndices((prevIndices) =>
      prevIndices.includes(index)
        ? prevIndices.filter((i) => i !== index)
        : [...prevIndices, index]
    );
  };

  return (
    <section
      className="bg-theme-dark w-screen p-10 md:p-20 lg:p-40 flex justify-center"
      id="faq"
    >
      <div className="max-w-2xl w-full">
        <div className="text-theme-color font-bold text-3xl mb-10">
          <h1>Frequently Asked Questions</h1>
        </div>
        <div className="flex flex-col">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md mb-4 overflow-hidden"
            >
              <div
                className="faq-question cursor-pointer flex justify-between items-center p-4 border-b border-gray-300"
                onClick={() => toggleExpand(index)}
              >
                <h3 className="text-lg font-bold text-theme-dark">
                  {faq.question}
                </h3>
                <span>
                  {expandedIndices.includes(index) ? (
                    <span className="text-theme-dark">&uarr;</span> 
                  ) : (
                    <span className="text-theme-dark">&darr;</span>
                  )}
                </span>
              </div>
              <div
                className={`faq-answer overflow-hidden transition-max-height duration-300 ease-in-out ${
                  expandedIndices.includes(index)
                    ? "max-h-96 p-4 bg-gray-50"
                    : "max-h-0"
                }`}
              >
                {expandedIndices.includes(index) && (
                  <p className="text-theme-dark">{faq.answer}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

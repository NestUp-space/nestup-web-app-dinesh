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
    <section className="bg-neutral-light py-24 flex justify-center" id="faq">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary-blue mb-4">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="flex flex-col max-w-3xl mx-auto">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-dls-lg shadow-lg mb-4 overflow-hidden border border-neutral-light"
            >
              <div
                className="faq-question cursor-pointer flex justify-between items-center p-4"
                onClick={() => toggleExpand(index)}
              >
                <h3 className="text-lg font-semibold text-neutral-dark">
                  {faq.question}
                </h3>
                <span>
                  {expandedIndices.includes(index) ? (
                    <span className="text-primary-orange">&uarr;</span> 
                  ) : (
                    <span className="text-primary-orange">&darr;</span>
                  )}
                </span>
              </div>
              <div
                className={`faq-answer overflow-hidden transition-max-height duration-300 ease-in-out ${
                  expandedIndices.includes(index)
                    ? "max-h-96 p-4 bg-neutral-light"
                    : "max-h-0"
                }`}
              >
                {expandedIndices.includes(index) && (
                  <p className="text-neutral-dark">{faq.answer}</p>
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

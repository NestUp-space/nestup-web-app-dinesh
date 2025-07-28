import React from 'react';
import Image from "next/legacy/image";

export default function AboutUsBirthSection() {
  return (
    <section className="py-12 md:py-16 lg:py-20 px-4 bg-lighter-bg">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-theme-color mb-8 leading-tight">
          And that's how <span className="italic">Nestup</span> was born.
        </h2>
        <p className="text-xl md:text-2xl text-dark-text mb-12 leading-relaxed font-light">
          A system, a mindset, and a promise to fix what's broken in the interiors industry.
        </p>
        <div className="relative w-full h-96 rounded-xl shadow-lg overflow-hidden">
          <Image
            src="/img/AC69B49B-1960-4DE3-AAC7-A3F46C7F1190.jpeg"
            alt="The birth of Nestup vision"
            layout="fill"
            objectFit="cover"
          />
        </div>
      </div>
    </section>
  );
}

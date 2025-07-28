import React from 'react';
import ProcessCard from '@/components/landing-page/ProcessCard';

export default function AboutUsProcessSection() {
  return (
    <section className="py-12 md:py-16 lg:py-20 px-4 bg-neutral-light">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center text-theme-color mb-16 leading-tight">
          Our Process in a Nutshell
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <ProcessCard title="Accurate Site Measurements" stepNumber={1} />
          <ProcessCard title="Design Inputs & 3D Modeling" stepNumber={2} />
          <ProcessCard title="Factory Production & QA" stepNumber={3} />
          <ProcessCard title="Plug-and-Play Installation" stepNumber={4} />
        </div>
        
        <div className="bg-white p-8 rounded-xl border border-light-border">
          <p className="text-lg md:text-xl text-center text-dark-text leading-relaxed">
            <span className="font-bold text-dark-color">We provide every detail</span> from cutlists to installation guides, so even a basic carpentry team can install with confidence. Need help? Our <span className="font-semibold text-very-dark-text">trained teams and site engineers</span> are just a call away.
          </p>
        </div>
      </div>
    </section>
  );
}

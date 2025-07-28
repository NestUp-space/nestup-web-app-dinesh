import React from 'react';

export default function AboutUsHeroSection() {
  return (
    <section className="relative text-center py-20 px-4 bg-lighter-bg">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-theme-color mb-8 leading-tight">
          About Nestup
        </h1>
        <p className="text-xl md:text-2xl text-dark-text max-w-3xl mx-auto leading-relaxed">
          From a dusty workshop to a revolution in modular interiors.
        </p>
      </div>
    </section>
  );
}

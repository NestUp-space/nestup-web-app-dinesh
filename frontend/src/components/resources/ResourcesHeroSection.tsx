import React from 'react';
import { Lightbulb } from 'lucide-react';

export function ResourcesHeroSection() {
  return (
    <section className="relative text-center py-20 px-4 bg-lighter-bg">
      <div className="max-w-4xl mx-auto">
        <div className="bg-theme-color w-20 h-20 flex items-center justify-center mx-auto mb-6 rounded-full">
          <Lightbulb className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-theme-color mb-8 leading-tight">
          Resources
        </h1>
        <p className="text-xl md:text-2xl text-dark-text max-w-3xl mx-auto leading-relaxed">
          Access our comprehensive library of tools, templates, blog posts and resources designed to streamline your modular
          interior design workflow.
        </p>
      </div>
    </section>
  );
}

import React from 'react';
import Image from "next/legacy/image";

export default function AboutUsWhyNestupSection() {
  return (
    <section className="py-12 md:py-16 lg:py-20 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="md:order-2">
          <Image
            src="/img/20250725_2021_Futuristic Indian Interiors_simple_compose_01k110zryqewfarpmbgz0xkbr1.png"
            alt="Futuristic Indian interiors representing modern convenience"
            width={800}
            height={600}
            className="w-full h-auto rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="md:order-1 min-h-[400px] md:min-h-[500px] flex flex-col justify-center space-y-4">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-theme-color leading-tight">
            Why Nestup Exists
          </h2>
          
          <div className="space-y-4 text-base md:text-lg leading-relaxed text-dark-text">
            <div className="bg-neutral-light p-6 rounded-xl border-l-4 border-theme-color">
              <p className="text-lg md:text-xl font-bold text-darkest-text leading-relaxed">
                Because in a country where groceries arrive in <span className="text-medium-interactive">10 minutes</span> and UPI payments are done in a blink—why does interior work still take <span className="text-darkest-text">2-3 months</span>?
              </p>
            </div>
            
            <p className="text-lg md:text-xl font-semibold text-center">
              We believe <span className="text-dark-color font-bold">convenience is no longer a luxury. It's a necessity.</span>
            </p>
            
            <div className="space-y-4">
              <p className="text-xl md:text-2xl font-bold text-darkest-text">
                Our vision is simple:
              </p>
              <p className="text-base md:text-lg leading-relaxed">
                Walk into a Nestup showroom, choose your designs, and have your woodwork installed <span className="font-bold text-theme-color">within a day</span>. We're not there yet, but we're getting close—<span className="font-semibold text-medium-interactive">fast</span>.
              </p>
            </div>
            
            <div className="bg-lighter-bg p-6 rounded-xl">
              <p className="text-lg md:text-xl font-bold text-center text-darkest-text leading-relaxed">
                We're not just building wardrobes and kitchens.<br/>
                <span className="text-theme-color">We're building a new standard</span> for how interiors should be done in India.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

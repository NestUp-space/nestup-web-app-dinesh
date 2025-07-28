import React from 'react';
import Image from "next/legacy/image";

export default function AboutUsPhilosophySection() {
  return (
    <section className="py-12 md:py-16 lg:py-20 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Image
            src="/img/20250725_1924_Enhanced CNC Machine Image_remix_01k10xnsbdf67b11qq6cnazc94.png"
            alt="Modern CNC machinery in factory"
            width={800}
            height={600}
            className="w-full h-auto rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="min-h-[400px] md:min-h-[500px] flex flex-col justify-center space-y-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-darkest-text leading-tight">
            <span className="text-theme-color">Nestup</span> is not just a modular factory.
          </h2>
          
          <div className="space-y-4 text-base md:text-lg leading-relaxed text-dark-text">
            <p>
              With years of hands-on experience, countless mistakes (and lessons), and a deep understanding of what designers and homeowners truly need, we built Nestup from the ground up to be <span className="font-bold text-medium-interactive">faster, smarter, and more reliable</span>.
            </p>
            
            <p>
              We've <span className="font-semibold text-theme-color">automated the chaos</span>—turning weeks of on-site carpentry into a streamlined, factory-led process that's clean, predictable, and high-quality.
            </p>
            
            <p>
              Our factory uses <span className="font-bold text-dark-color">cutting-edge CNC tech, automated pressing, and precise edge banding</span> to craft modular units that are built to last and made to fit. Every screw hole, hinge notch, and groove is calculated down to the millimeter.
            </p>
            
            <div className="bg-neutral-light p-6 rounded-xl border-l-4 border-theme-color">
              <p className="text-lg md:text-xl font-bold text-darkest-text">
                And the best part? Once materials are received, we commit to dispatch-ready modulars in just <span className="text-theme-color">14 working days</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

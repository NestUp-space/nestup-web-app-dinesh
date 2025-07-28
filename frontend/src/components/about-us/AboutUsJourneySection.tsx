import React from 'react';
import Image from "next/legacy/image";

export default function AboutUsJourneySection() {
  return (
    <section className="py-12 md:py-16 lg:py-20 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="md:order-2">
          <div className="relative w-full h-96 rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-500 overflow-hidden">
            <Image
              src="/img/20250725_1901_Modern Office Entrance_remix_01k10wd1s3e589qtwtm9esg9bx.png"
              alt="Modern office entrance showcasing interior design work"
              layout="fill"
              objectFit="cover"
            />
          </div>
        </div>
        <div className="md:order-1 min-h-[400px] md:min-h-[500px] flex flex-col justify-center space-y-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-darkest-text leading-tight mb-6">
            From a dusty workshop to a revolution in modular interiors
          </h2>
          
          <div className="space-y-4 text-base md:text-lg leading-relaxed text-dark-text">
            <p>
              <span className="text-lg md:text-xl font-semibold text-theme-color">&ldquo;Nine years ago</span>, in my third year of college, I found myself helping my dad set up a CNC router in his humble woodworking shop. I had no idea that those <span className="font-semibold text-darkest-text">late nights learning software and training his team</span> would plant the first seeds of a much larger journey.
            </p>
            
            <p>
              After graduating, I worked in the corporate world for a while. But the real calling came when I teamed up with a close friend to start an interior design firm. The creative satisfaction was immense, but so were the challenges—<span className="font-semibold text-darkest-text">manual carpentry teams, unreliable timelines, and frustrating compromises</span> on quality and cost.
            </p>
            
            <p className="text-lg md:text-xl font-medium text-darkest-text">
              We knew there had to be a better way.&rdquo;
            </p>
            <p className="text-m md:text-lg font-small text-theme-color text-right">
              - Vamsi Pratap (Founder and CEO - Nestup)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

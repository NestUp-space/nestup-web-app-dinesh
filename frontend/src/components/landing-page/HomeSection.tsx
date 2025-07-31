"use client";

import React, { useState } from "react";
import { CTAButton } from "./CTAButton";
import Image from "next/legacy/image";
import bgImg from "@img/homeBg.jpeg";

export function HomeSection() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  return (
    <section className="flex flex-col" id="home">
      <div className="min-h-screen flex relative">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <Image
            src={bgImg}
            alt="Professional modular furniture background"
            className="object-cover w-full h-full opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full flex items-center justify-center px-4 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Column - Content */}
            <div className="space-y-8">
              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight">
                  Precision Modular Systems for{" "}
                  <span className="text-secondary">Interior Design Excellence</span>
                </h1>
                
                {/* Subheading with Key Benefits */}
                <div className="flex flex-wrap gap-2 text-lg md:text-xl text-muted-foreground">
                  <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full font-medium">
                    14-Day Delivery
                  </span>
                  <span className="bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
                    Technical Specifications
                  </span>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                    End-to-End Partnership
                  </span>
                </div>
              </div>

              {/* Professional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-primary/20 hover:border-primary/40 hover:shadow-lg">
                    <div className="text-2xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">Designer Projects</div>
                  </div>
                </div>
                
                <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-secondary/20 hover:border-secondary/40 hover:shadow-lg">
                    <div className="text-2xl font-bold text-secondary">30+</div>
                    <div className="text-sm text-muted-foreground">Material Options</div>
                  </div>
                </div>
                
                <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-accent/20 hover:border-accent/40 hover:shadow-lg">
                    <div className="text-2xl font-bold text-accent">ISO</div>
                    <div className="text-sm text-muted-foreground">Quality Standards</div>
                  </div>
                </div>
              </div>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/book-visit" className="flex-1 sm:flex-none">
                  <CTAButton text="Book a Free Site Visit" />
                </a>
              </div>
            </div>

            {/* Right Column - Video */}
            <div className="relative">
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl border border-primary/20">
                {!videoLoaded ? (
                  <div 
                    className="relative w-full h-full cursor-pointer group"
                    onClick={handleVideoLoad}
                  >
                    <Image
                      src="https://img.youtube.com/vi/K3iCPEizTsE/maxresdefault.jpg"
                      alt="Nestup Modular Furniture Process Thumbnail"
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                        <div className="text-white font-medium text-lg">
                          Watch Our Process
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src="https://www.youtube.com/embed/K3iCPEizTsE?start=0&autoplay=1"
                    title="Nestup Modular Furniture Process"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
              
              {/* Video Caption */}
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  See how we deliver precision modular solutions for interior designers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

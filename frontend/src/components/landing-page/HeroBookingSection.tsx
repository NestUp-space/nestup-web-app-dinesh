"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from "next/image";

const HeroBookingSection: React.FC = () => {
  const [playVideo, setPlayVideo] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Define YouTube embed URL as a constant (official embed code)
  const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/K3iCPEizTsE?si=Bnzd-3ZECZ9XhHnw&autoplay=1";

  const handlePlayClick = () => {
    setPlayVideo(true);
  };

  // Set iframe src after component mounts to ensure proper loading
  useEffect(() => {
    if (playVideo && iframeRef.current) {
      // Set the src directly - React will handle it properly
      iframeRef.current.src = YOUTUBE_EMBED_URL;
    }
  }, [playVideo]);

  return (
    <section className="hero-booking bg-neutral-light py-16 md:py-24">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="hero-content md:w-1/2 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-dark leading-tight mb-4">Book Your Free Site Visit</h1>
          <p className="hero-subtitle text-lg text-technical-gray mb-8">Get precise laser measurements, instant estimates, and see how our AI-powered modular manufacturing can transform your space in just 14 days.</p>
          
          <div className="value-props grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="prop flex flex-col items-center md:items-start text-center md:text-left">
              <span className="text-4xl mb-2 text-primary-orange">📏</span>
              <span className="text-neutral-dark font-medium">Laser-precise measurements</span>
            </div>
            <div className="prop flex flex-col items-center md:items-start text-center md:text-left">
              <span className="text-4xl mb-2 text-primary-orange">💰</span>
              <span className="text-neutral-dark font-medium">Instant cost estimation</span>
            </div>
            <div className="prop flex flex-col items-center md:items-start text-center md:text-left">
              <span className="text-4xl mb-2 text-primary-orange">🎯</span>
              <span className="text-neutral-dark font-medium">Customized design preview</span>
            </div>
          </div>
        </div>
        
        <div className="hero-visual md:w-1/2 mt-8 md:mt-0">
          <div className="relative w-full h-96">
            <Image 
                  src="/img/PHOTO-2024-11-01-12-29-07.jpg" 
                  alt="Site visit and measurement process" 
                  layout="fill" 
                  objectFit="cover" 
                  className="rounded-lg shadow-lg"
                />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBookingSection;
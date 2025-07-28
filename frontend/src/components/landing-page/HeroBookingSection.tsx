"use client";
import React, { useState } from 'react';
import Image from "next/image";

const HeroBookingSection: React.FC = () => {
  const [playVideo, setPlayVideo] = useState(false);

  const handlePlayClick = () => {
    setPlayVideo(true);
  };

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
            {playVideo ? (
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                src="https://www.youtube.com/embed/K3iCPEizTsE?autoplay=1"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <>
                <Image 
                  src="/img/PHOTO-2024-11-01-12-29-07.jpg" 
                  alt="Site visit and measurement process" 
                  layout="fill" 
                  objectFit="cover" 
                  className="rounded-lg shadow-lg"
                />
                <button 
                  onClick={handlePlayClick} 
                  className="absolute inset-0 flex items-center justify-center w-full h-full bg-black bg-opacity-50"
                  aria-label="Play video"
                >
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path>
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBookingSection;

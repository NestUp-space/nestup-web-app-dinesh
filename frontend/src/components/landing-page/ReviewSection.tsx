"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReviewCard from './ReviewCard';
import { Review } from '@/types/reviews';
import reviewsData from '@/constants/reviewsData/index.json';

const ReviewSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const reviews: Review[] = reviewsData.reviews;
  
  // Start with a safe default that works for both server and client
  const [visibleCards, setVisibleCards] = useState(3);

  // Get number of visible cards based on screen size
  const getVisibleCards = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1280) return 4; // xl screens
      if (window.innerWidth >= 1024) return 3; // lg screens
      if (window.innerWidth >= 768) return 2;  // md screens
      return 1; // sm screens
    }
    return 3; // default for SSR
  };

  // Handle client-side hydration and responsive behavior
  useEffect(() => {
    setIsClient(true);
    setVisibleCards(getVisibleCards());

    const handleResize = () => {
      setVisibleCards(getVisibleCards());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if we need carousel functionality
  const needsCarousel = reviews.length > visibleCards;
  
  // Calculate total slides and max index correctly
  const totalSlides = needsCarousel ? Math.ceil(reviews.length / visibleCards) : 1;
  const maxIndex = Math.max(0, totalSlides - 1);

  // Reset currentIndex if it's out of bounds (can happen on resize)
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(0);
    }
  }, [currentIndex, maxIndex]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isHovered && needsCarousel) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          // Reset to beginning when we reach the end
          if (nextIndex > maxIndex) {
            return 0;
          }
          return nextIndex;
        });
      }, 3000); // Change slide every 3 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, needsCarousel, maxIndex]);

  const nextSlide = () => {
    if (needsCarousel) {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex > maxIndex) {
          return 0;
        }
        return nextIndex;
      });
    }
  };

  const prevSlide = () => {
    if (needsCarousel) {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex - 1;
        if (nextIndex < 0) {
          return maxIndex;
        }
        return nextIndex;
      });
    }
  };

  // Calculate the actual number of cards to show (don't exceed available reviews)
  const cardsToShow = Math.min(visibleCards, reviews.length);

  return (
    <div className="bg-lighter-bg py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-darkest-text mb-4">
            Testimonials
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons - Only show if carousel is needed */}
          {needsCarousel && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-lightest-bg rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-light-border"
                aria-label="Previous reviews"
              >
                <svg className="w-6 h-6 text-dark-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-lightest-bg rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-light-border"
                aria-label="Next reviews"
              >
                <svg className="w-6 h-6 text-dark-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Carousel */}
          <div 
            className={`overflow-hidden ${needsCarousel ? 'mx-8' : 'mx-0'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <motion.div
              className="flex"
              animate={{
                x: needsCarousel ? `${-currentIndex * (100 / cardsToShow)}%` : '0%'
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              style={{
                width: needsCarousel ? `${(totalSlides * 100)}%` : '100%'
              }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{ 
                    width: needsCarousel 
                      ? `${100 / (totalSlides * cardsToShow)}%` 
                      : `${100 / cardsToShow}%` 
                  }}
                  className="flex-shrink-0 px-2"
                >
                  <ReviewCard review={review} />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Dots Indicator - Only show if carousel is needed */}
        {needsCarousel && totalSlides > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === currentIndex
                    ? 'bg-theme-color'
                    : 'bg-light-bw hover:bg-medium-interactive-bw'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
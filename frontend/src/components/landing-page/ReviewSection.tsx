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
  
  const [visibleCards, setVisibleCards] = useState(3);

  const getVisibleCards = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1280) return 3; 
      if (window.innerWidth >= 768) return 2;
      return 1;
    }
    return 3;
  };

  useEffect(() => {
    setIsClient(true);
    const updateVisibleCards = () => {
      setVisibleCards(getVisibleCards());
    };
    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  const needsCarousel = reviews.length > visibleCards;
  
  const totalSlides = needsCarousel ? Math.ceil(reviews.length / visibleCards) : 1;
  const maxIndex = Math.max(0, totalSlides - 1);

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(0);
    }
  }, [currentIndex, maxIndex]);

  useEffect(() => {
    if (!isHovered && needsCarousel) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
      }, 4000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, needsCarousel, totalSlides]);

  const nextSlide = () => {
    if (needsCarousel) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    }
  };

  const prevSlide = () => {
    if (needsCarousel) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
    }
  };

  const cardsToShow = Math.min(visibleCards, reviews.length);

  return (
    <div className="bg-lighter-bg py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-primary font-extrabold text-darkest-text mb-4">
            Trusted by Innovators
          </h2>
          <p className="text-lg text-dark-text max-w-3xl mx-auto">
            Our clients&#39; success stories are the best measure of our commitment and expertise.
          </p>
        </div>

        <div className="relative">
          {needsCarousel && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-all duration-200 border border-light-border"
                aria-label="Previous reviews"
              >
                <svg className="w-6 h-6 text-dark-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-all duration-200 border border-light-border"
                aria-label="Next reviews"
              >
                <svg className="w-6 h-6 text-dark-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div 
            className={`overflow-hidden ${needsCarousel ? 'mx-12' : 'mx-0'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <motion.div
              className="flex"
              animate={{ x: needsCarousel ? `${-currentIndex * 100}%` : '0%' }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div key={slideIndex} className="flex-shrink-0 w-full flex justify-center">
                  {reviews.slice(slideIndex * cardsToShow, (slideIndex + 1) * cardsToShow).map(review => (
                    <div
                      key={review.id}
                      style={{ width: `${100 / cardsToShow}%` }}
                      className="flex-shrink-0 px-3"
                    >
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {needsCarousel && totalSlides > 1 && (
          <div className="flex justify-center mt-10 space-x-3">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-theme-color scale-125'
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

import React from 'react';
import { Review } from '@/types/reviews';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-theme-color' : 'text-light-bw'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 1l2.939 4.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    ));
  };

  return (
    <div className="bg-lightest-bg rounded-lg shadow-md p-6 mx-2 min-h-[280px] flex flex-col border border-light-border">
      {/* Rating at Top */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex space-x-1">{renderStars(review.rating)}</div>
      </div>

      {/* Review Text in Middle */}
      <div className="flex-grow flex items-center justify-center mb-4">
        <p className="text-dark-text text-base leading-relaxed text-center italic">
          &ldquo;{review.review}&rdquo;
        </p>
      </div>

      {/* User Name and Avatar at Bottom */}
      <div className="flex items-center justify-center space-x-3 mt-auto">
        <div className="w-10 h-10 bg-theme-color rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {review.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-darkest-text text-sm text-center">{review.name}</h3>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;

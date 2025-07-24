// frontend/src/components/landing-page/ReviewSection.tsx

"use client";
import React from 'react';
import Image from 'next/image';

const ReviewSection = () => {
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">
          Testimonials
        </h2>
        <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-3">
          {/* Review 1 */}
          <div className="bg-gray-100 rounded-lg p-6">
            <Image
              className="w-16 h-16 rounded-full mx-auto"
              src="/img/placeholder.png"
              alt="Reviewer 1"
              width={64}
              height={64}
            />
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 1l2.939 4.955 6.572.955-4.756 4.635 1.123 6.545z"
                    />
                  </svg>
                ))}
              </div>
              <p className="mt-2 text-gray-500">
                 &ldquo;Really impressed with their smooth process and quality! They
                offered great customization options, and the delivery was super
                fast.&rdquo;
              </p>
              <p className="mt-2 font-bold">&sim; Raju Yadav</p>
            </div>
          </div>
          {/* Review 2 */}
          <div className="bg-gray-100 rounded-lg p-6">
            <Image
              className="w-16 h-16 rounded-full mx-auto"
              src="/img/placeholder.png"
              alt="Reviewer 2"
              width={64}
              height={64}
            />
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 1l2.939 4.955 6.572.955-4.756 4.635 1.123 6.545z"
                    />
                  </svg>
                ))}
              </div>
              <p className="mt-2 text-gray-500">
                &ldquo;Really impressed with their smooth process and quality! They
                offered great customization options, and the delivery was super
                fast.&rdquo;
              </p>
              <p className="mt-2 font-bold">&sim; Sunitha Devi</p>
            </div>
          </div>
          {/* Review 3 */}
          <div className="bg-gray-100 rounded-lg p-6">
            <Image
              className="w-16 h-16 rounded-full mx-auto"
              src="/img/placeholder.png"
              alt="Reviewer 3"
              width={64}
              height={64}
            />
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 1l2.939 4.955 6.572.955-4.756 4.635 1.123 6.545z"
                    />
                  </svg>
                ))}
              </div>
              <p className="mt-2 text-gray-500">
                 &ldquo;Really impressed with their smooth process and quality! They
                offered great customization options, and the delivery was super
                fast.&rdquo;
              </p>
              <p className="mt-2 font-bold">&sim; Ramesh Reddy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;

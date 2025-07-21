// frontend/src/components/landing-page/ServiceSection.tsx

"use client";
import React from 'react';

const ServiceSection = () => {
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Service 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <img src="/img/delivery.png" alt="14 Days Delivery" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              14 Days Delivery
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              We promise to deliver your fully customized modular units within
              just 14 days, ensuring quality, precision, and complete
              satisfaction!
            </p>
          </div>
          {/* Service 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <img src="/img/end-to-end.png" alt="End-to-End Service" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              End-to-End Service
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              From concept to completion, we provide end-to-end solutions,
              managing every detail with care, expertise and unwavering
              commitment.
            </p>
          </div>
          {/* Service 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <img src="/img/custom.png" alt="Custom Solutions" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Custom Solutions
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Tailored designs crafted to perfectly match your unique needs,
              preferences, and style, ensuring every detail reflects your
              individuality.
            </p>
          </div>
          {/* Service 4 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <img src="/img/transparent.png" alt="Transparent Process" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Transparent Process
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              No hidden costs or surprises—just honest communication and
              reliable service. An investment in a future of comfort, elegance,
              and functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceSection;

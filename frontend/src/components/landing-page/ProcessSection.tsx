// frontend/src/components/landing-page/ProcessSection.tsx

"use client";
import React from 'react';
import Image from 'next/image';

const ProcessSection = () => {
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">
          Every Step Matters. See How.
        </h2>
        <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-4 lg:grid-cols-4">
          {/* Process 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/measure.png" alt="Measure" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Measure</h3>
          </div>
          {/* Process 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/model.png" alt="Model" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Model</h3>
          </div>
          {/* Process 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/input.png" alt="Input" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Input</h3>
          </div>
          {/* Process 4 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/design.png" alt="Design" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Design</h3>
          </div>
          {/* Process 5 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/estimate.png" alt="Estimate" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Estimate</h3>
          </div>
          {/* Process 6 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/check.png" alt="Check" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Check</h3>
          </div>
          {/* Process 7 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/invoice.png" alt="Invoice" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Invoice</h3>
          </div>
          {/* Process 8 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/payment.png" alt="Payment" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Payment</h3>
          </div>
           {/* Process 9 */}
           <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/factory.png" alt="Factory" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Factory</h3>
          </div>
          {/* Process 10 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/packing.png" alt="Packing" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Packing</h3>
          </div>
          {/* Process 11 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/dispatch.png" alt="Dispatch" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Dispatch</h3>
          </div>
          {/* Process 12 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16">
              <Image src="/img/install.png" alt="Install" width={64} height={64} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Install</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSection;

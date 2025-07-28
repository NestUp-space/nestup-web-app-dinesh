import React from 'react';

const VisitProcessSection: React.FC = () => {
  return (
    <section className="visit-process py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">What Happens During Your Free Site Visit?</h2>
        
        <div className="process-steps grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="step bg-neutral-light p-6 rounded-lg shadow-sm text-center">
            <div className="step-number flex items-center justify-center w-12 h-12 bg-primary-orange text-white rounded-full text-xl font-bold mx-auto mb-4">1</div>
            <h3 className="text-xl font-semibold text-neutral-dark mb-2">Precision Measurement</h3>
            <p className="text-technical-gray mb-3">Our experts use advanced laser measurement tools to capture every detail of your space with millimeter accuracy.</p>
            <span className="duration text-sm text-technical-gray">Duration: 30-45 minutes</span>
          </div>
          
          <div className="step bg-neutral-light p-6 rounded-lg shadow-sm text-center">
            <div className="step-number flex items-center justify-center w-12 h-12 bg-primary-orange text-white rounded-full text-xl font-bold mx-auto mb-4">2</div>
            <h3 className="text-xl font-semibold text-neutral-dark mb-2">3D Design Consultation</h3>
            <p className="text-technical-gray mb-3">See your modular furniture come to life with our 3D modeling software. Discuss materials, finishes, and customizations.</p>
            <span className="duration text-sm text-technical-gray">Duration: 20-30 minutes</span>
          </div>
          
          <div className="step bg-neutral-light p-6 rounded-lg shadow-sm text-center">
            <div className="step-number flex items-center justify-center w-12 h-12 bg-primary-orange text-white rounded-full text-xl font-bold mx-auto mb-4">3</div>
            <h3 className="text-xl font-semibold text-neutral-dark mb-2">Instant Cost Estimate</h3>
            <p className="text-technical-gray mb-3">Receive transparent pricing on the spot - no hidden costs, no surprises. Just honest, competitive rates.</p>
            <span className="duration text-sm text-technical-gray">Duration: 10-15 minutes</span>
          </div>
          
          <div className="step bg-neutral-light p-6 rounded-lg shadow-sm text-center">
            <div className="step-number flex items-center justify-center w-12 h-12 bg-primary-orange text-white rounded-full text-xl font-bold mx-auto mb-4">4</div>
            <h3 className="text-xl font-semibold text-neutral-dark mb-2">Production Timeline</h3>
            <p className="text-technical-gray mb-3">Get your complete 14-day delivery schedule and understand our proven 12-step manufacturing process.</p>
            <span className="duration text-sm text-technical-gray">Duration: 5-10 minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisitProcessSection;

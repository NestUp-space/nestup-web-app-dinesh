import React from 'react';

const FaqSection: React.FC = () => {
  return (
    <section className="faq-section py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-dark text-center mb-12">Frequently Asked Questions</h2>
        
        <div className="faq-grid grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="faq-item bg-neutral-light p-6 rounded-lg shadow-sm">
            <h4 className="text-xl font-semibold text-neutral-dark mb-3">Is the site visit really free?</h4>
            <p className="text-technical-gray">Yes, absolutely! Our site visit includes professional laser measurements, 3D design consultation, and instant cost estimation - all completely free with no obligations.</p>
          </div>
          
          <div className="faq-item bg-neutral-light p-6 rounded-lg shadow-sm">
            <h4 className="text-xl font-semibold text-neutral-dark mb-3">How long does a site visit take?</h4>
            <p className="text-technical-gray">Typically 60-90 minutes depending on project complexity. We ensure thorough measurement and consultation without rushing.</p>
          </div>
          
          <div className="faq-item bg-neutral-light p-6 rounded-lg shadow-sm">
            <h4 className="text-xl font-semibold text-neutral-dark mb-3">What should I prepare for the visit?</h4>
            <p className="text-technical-gray">Just ensure the space is accessible. If you have design inspirations, measurements, or specific requirements, feel free to share them with our team.</p>
          </div>
          
          <div className="faq-item bg-neutral-light p-6 rounded-lg shadow-sm">
            <h4 className="text-xl font-semibold text-neutral-dark mb-3">Can I reschedule if needed?</h4>
            <p className="text-technical-gray">Of course! Life happens. Just call us at 8885563262 or email team@nestup.space to reschedule at your convenience.</p>
          </div>
          
          <div className="faq-item bg-neutral-light p-6 rounded-lg shadow-sm">
            <h4 className="text-xl font-semibold text-neutral-dark mb-3">Do you service areas outside Hyderabad?</h4>
            <p className="text-technical-gray">We primarily serve Hyderabad and surrounding areas. For projects outside our standard service area, please discuss during booking.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;

import React from 'react';

const BookingUrgencySection: React.FC = () => {
  return (
    <section className="booking-urgency py-16 md:py-24 bg-neutral-light">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-8">
        <div className="urgency-box bg-white p-8 rounded-lg shadow-md text-center md:w-1/2">
          <h4 className="text-2xl font-bold text-primary-orange mb-4">🔥 Limited Slots Available</h4>
          <p className="text-technical-gray text-lg">Only <strong className="text-primary-orange">3 slots</strong> remaining this week. Book now to secure your preferred time.</p>
        </div>
        
        <div className="guarantee-box bg-white p-8 rounded-lg shadow-md text-center md:w-1/2">
          <h4 className="text-2xl font-bold text-primary-orange mb-4">💯 Our Promise</h4>
          <p className="text-technical-gray text-lg">If you&#39;re not completely satisfied with our site visit and consultation, we&#39;ll make it right - guaranteed.</p>
        </div>
      </div>
    </section>
  );
};

export default BookingUrgencySection;

import React from 'react';

const SocialProofSection: React.FC = () => {
  return (
    <section className="social-proof py-16 md:py-24 bg-neutral-light">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-dark text-center mb-12">Why 500+ Interior Designers Choose NestUp</h2>
        
        <div className="testimonials-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="testimonial bg-white p-6 rounded-lg shadow-sm">
            <div className="rating text-warm-gold text-2xl mb-3">⭐⭐⭐⭐⭐</div>
            <p className="text-technical-gray mb-4">"Fast delivery, budget-friendly pricing, and excellent finish quality. Material estimates were spot on."</p>
            <cite className="font-semibold text-neutral-dark">- Interior Designer, Hyderabad</cite>
          </div>
          
          <div className="testimonial bg-white p-6 rounded-lg shadow-sm">
            <div className="rating text-warm-gold text-2xl mb-3">⭐⭐⭐⭐⭐</div>
            <p className="text-technical-gray mb-4">"Value for money and finishing is awesome. Huge difference between manual carpenter and machine finishing."</p>
            <cite className="font-semibold text-neutral-dark">- Home Owner, Secunderabad</cite>
          </div>
          
          <div className="testimonial bg-white p-6 rounded-lg shadow-sm">
            <div className="rating text-warm-gold text-2xl mb-3">⭐⭐⭐⭐⭐</div>
            <p className="text-technical-gray mb-4">"Been working with them for more than 12 projects now, hardworking and very responsive team."</p>
            <cite className="font-semibold text-neutral-dark">- Interior Designer Partner</cite>
          </div>
        </div>
        
        <div className="trust-indicators grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="indicator bg-white p-6 rounded-lg shadow-sm">
            <strong className="block text-4xl font-bold text-primary-orange mb-2">12,000+</strong>
            <span className="text-technical-gray text-lg">Modular Units Delivered</span>
          </div>
          <div className="indicator bg-white p-6 rounded-lg shadow-sm">
            <strong className="block text-4xl font-bold text-primary-orange mb-2">14 Days</strong>
            <span className="text-technical-gray text-lg">Guaranteed Delivery</span>
          </div>
          <div className="indicator bg-white p-6 rounded-lg shadow-sm">
            <strong className="block text-4xl font-bold text-primary-orange mb-2">30+ Years</strong>
            <span className="text-technical-gray text-lg">Craftsmanship Experience</span>
          </div>
          <div className="indicator bg-white p-6 rounded-lg shadow-sm">
            <strong className="block text-4xl font-bold text-primary-orange mb-2">99%</strong>
            <span className="text-technical-gray text-lg">Customer Satisfaction</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;

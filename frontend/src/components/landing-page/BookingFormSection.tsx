"use client";

import { useState, useEffect } from "react";
import { CTAButton } from "./CTAButton";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface BookingFormSectionProps {
  onSubmit: (formData: any) => void;
}

const BookingFormSection: React.FC<BookingFormSectionProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    propertyAddress: "",
    projectType: "",
    budgetRange: "",
    projectTimeline: "",
    additionalRequirements: "",
    preferredSlot: new Date(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedData = localStorage.getItem("formData");
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("formData", JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({ ...prev, preferredSlot: date }));
    }
  };

  const validateContactDetails = () => {
    const { phone, email, fullName, propertyAddress, projectType } = formData;
    const phoneRegex = /^\d{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return (
      phoneRegex.test(phone) &&
      emailRegex.test(email) &&
      fullName.trim() !== "" &&
      propertyAddress.trim() !== "" &&
      projectType.trim() !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContactDetails()) {
      setErrorMessage("Please fill in all required fields and provide valid contact details.");
      setSubmitStatus('error');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/site-visit/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        onSubmit(data);
        localStorage.removeItem("formData");
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.message || "An error occurred while booking the site visit.");
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage("An error occurred while booking the site visit. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterPassedTime = (time: Date) => {
    const selectedDate = new Date(time);
    const hours = selectedDate.getHours();
    return hours >= 8 && hours <= 18;
  };

  const filterPassedDates = (currentDate: Date) => {
    const today = new Date();
    return currentDate > today;
  };

  if (submitStatus === 'success') {
    return (
      <div className="flex justify-center items-center bg-gray-100 h-screen">
        <div className="w-full max-w-xl p-6 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-theme-color text-4xl font-bold mb-4">Success!</h1>
          <p className="text-dark-color-bw text-xl mb-6">Your site visit has been booked successfully.</p>
          <CTAButton text="Back to Home" onClick={() => window.location.href = "/"} />
        </div>
      </div>
    );
  }

  return (
    <section className="booking-form-section py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-12">
        {/* Left Column - Interactive Booking Calendar */}
        <div className="booking-calendar lg:w-1/2 bg-white p-8 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Your Preferred Date & Time</h3>
          
          <div className="calendar-widget mb-8">
            <DatePicker
              selected={formData.preferredSlot instanceof Date ? formData.preferredSlot : new Date()}
              onChange={handleDateChange}
              filterDate={filterPassedDates}
              dateFormat="MMMM d, yyyy"
              minDate={new Date()}
              inline
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
            />
          </div>
          
        </div>
        
        {/* Right Column - Contact Information & Project Details */}
        <div className="booking-form lg:w-1/2 bg-white p-8 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-neutral-dark mb-6">Your Project Details</h3>
          
          {submitStatus === 'error' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="block text-technical-gray text-sm font-medium mb-2">Full Name *</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"/>
            </div>
            
            <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="block text-technical-gray text-sm font-medium mb-2">Phone Number *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required maxLength={10} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"/>
              </div>
              <div className="form-group">
                <label className="block text-technical-gray text-sm font-medium mb-2">Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"/>
              </div>
            </div>
            
            <div className="form-group">
              <label className="block text-technical-gray text-sm font-medium mb-2">Property Address *</label>
              <textarea name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} placeholder="Complete address where site visit is required" required rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"></textarea>
            </div>
            
            <div className="form-group">
              <label className="block text-technical-gray text-sm font-medium mb-2">Project Type *</label>
              <select name="projectType" value={formData.projectType} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange bg-white">
                <option value="">Select project type</option>
                <option>Kitchen Modular Units</option>
                <option>Bedroom Wardrobe & Storage</option>
                <option>Living Room Furniture</option>
                <option>Office Modular Setup</option>
                <option>Complete Home Interior</option>
                <option>Commercial Space</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="block text-technical-gray text-sm font-medium mb-2">Approximate Budget Range</label>
              <select name="budgetRange" value={formData.budgetRange} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange bg-white">
                <option value="">Select budget range</option>
                <option>₹1-3 Lakhs</option>
                <option>₹3-5 Lakhs</option>
                <option>₹5-10 Lakhs</option>
                <option>₹10+ Lakhs</option>
                <option>I&#39;ll discuss during visit</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="block text-technical-gray text-sm font-medium mb-2">Project Timeline</label>
              <select name="projectTimeline" value={formData.projectTimeline} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange bg-white">
                <option value="">When do you need this completed?</option>
                <option>Within 1 month</option>
                <option>1-3 months</option>
                <option>3-6 months</option>
                <option>Just exploring options</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="block text-technical-gray text-sm font-medium mb-2">Additional Requirements</label>
              <textarea name="additionalRequirements" value={formData.additionalRequirements} onChange={handleChange} placeholder="Any specific requirements, measurements you have, or questions about the process?" rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"></textarea>
            </div>
            
            <button type="submit" className="cta-button w-full bg-primary-orange text-white py-3 rounded-lg font-semibold text-lg hover:bg-orange-700 transition-colors flex flex-col items-center justify-center" disabled={isSubmitting}>
              {isSubmitting ? 'Booking...' : 'Book Free Site Visit'}
              <span className="button-subtitle text-sm opacity-80 mt-1">Confirmed instantly</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default BookingFormSection;

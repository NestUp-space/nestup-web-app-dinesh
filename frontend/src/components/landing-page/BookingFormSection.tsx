"use client";

"use client";

import { useState, useEffect } from "react";
import { CTAButton } from "./CTAButton";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface BookingResponse {
  success: boolean;
  bookingId?: string;
  crmLeadId?: string;
  calendarEventId?: string;
  message?: string;
  error?: string;
  details?: string;
}

interface BookingFormSectionProps {
  onSubmit: (bookingDetails: {
    bookingId?: string;
    crmLeadId?: string;
    calendarEventId?: string;
    customerName: string;
    appointmentDate: string;
  }) => void;
}

const validateIndianPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile numbers start with 6-9
  return phoneRegex.test(phone);
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};

const validateBusinessHours = (date: Date): boolean => {
  const hours = date.getHours();
  return hours >= 8 && hours <= 18; // 8 AM to 6 PM
};

const validateFutureDate = (date: Date): boolean => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next day
  return date > tomorrow;
};

const BookingFormSection: React.FC<BookingFormSectionProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: ""
    },
    preferredDateTime: new Date(),
    alternateDateTime: null as Date | null,
    projectType: "",
    projectTimeline: "",
    requirements: "",
    source: "website",
    utmParams: {
      utm_source: "",
      utm_medium: "",
      utm_campaign: ""
    }
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

  useEffect(() => {
    // Extract UTM parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || ''
    };
    
    if (utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) {
      setFormData(prev => ({
        ...prev,
        utmParams
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleUtmChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      utmParams: {
        ...prev.utmParams,
        [field]: value
      }
    }));
  };

  const handleAlternateDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      alternateDateTime: date
    }));
  };

  const handlePreferredDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({ ...prev, preferredDateTime: date }));
    }
  };

  const validateContactDetails = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.firstName.trim()) {
      errors.push("First name is required");
    }
    
    if (!formData.lastName.trim()) {
      errors.push("Last name is required");
    }
    
    if (!validateEmail(formData.email)) {
      errors.push("Please provide a valid email address");
    }
    
    if (!validateIndianPhoneNumber(formData.phone)) {
      errors.push("Please provide a valid 10-digit Indian mobile number starting with 6-9");
    }
    
    if (!formData.address.street.trim()) {
      errors.push("Street address is required");
    }
    
    if (!formData.address.city.trim()) {
      errors.push("City is required");
    }
    
    if (!formData.address.state.trim()) {
      errors.push("State is required");
    }
    
    if (!validatePincode(formData.address.pincode)) {
      errors.push("Please provide a valid 6-digit pincode");
    }
    
    if (!validateFutureDate(formData.preferredDateTime)) {
      errors.push("Preferred date must be at least 24 hours in the future");
    }
    
    if (!validateBusinessHours(formData.preferredDateTime)) {
      errors.push("Preferred time must be between 8:00 AM and 6:00 PM");
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateContactDetails();
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join(", "));
      setSubmitStatus('error');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site-visit/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          preferredDateTime: formData.preferredDateTime.toISOString(),
          alternateDateTime: formData.alternateDateTime?.toISOString() || null,
          requirements: formData.requirements,
          source: formData.source,
          utmParams: formData.utmParams
        }),
      });

      const data: BookingResponse = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        const bookingDetails = {
          bookingId: data.bookingId,
          crmLeadId: data.crmLeadId,
          calendarEventId: data.calendarEventId,
          customerName: `${formData.firstName} ${formData.lastName}`,
          appointmentDate: formData.preferredDateTime.toLocaleDateString()
        };
        
        onSubmit(bookingDetails);
        localStorage.removeItem("formData");
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.error || data.message || "An error occurred while booking the site visit.");
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
         <div className="booking-form lg:w-1/2 bg-white p-8 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-neutral-dark mb-6">Your Project Details</h3>
          
          {submitStatus === 'error' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="block text-technical-gray text-sm font-medium mb-2">First Name *</label>
                <input 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                />
              </div>
              <div className="form-group">
                <label className="block text-technical-gray text-sm font-medium mb-2">Last Name *</label>
                <input 
                  type="text" 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="block text-technical-gray text-sm font-medium mb-2">Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                />
              </div>
              <div className="form-group">
                <label className="block text-technical-gray text-sm font-medium mb-2">Phone Number *</label>
                <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-orange">
                  <span className="px-3 text-gray-500">+91</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    className="w-full px-4 py-2 border-l border-gray-300 focus:outline-none"
                    pattern="\d{10}"
                    title="Please enter a 10-digit phone number"
                  />
                </div>
              </div>
            </div>

            {/* Address Fields */}
            <div className="form-group">
              <label className="block text-technical-gray text-sm font-medium mb-2">Street Address *</label>
              <input 
                type="text" 
                value={formData.address.street} 
                onChange={(e) => handleAddressChange('street', e.target.value)} 
                required 
                placeholder="House/Flat No., Street Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
              />
            </div>
            
            <div className="form-row grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="form-group">
                <label className="block text-technical-gray text-sm font-medium mb-2">City *</label>
                <input 
                  type="text" 
                  value={formData.address.city} 
                  onChange={(e) => handleAddressChange('city', e.target.value)} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                />
              </div>
              <div className="form-group">
                <label className="block text-technical-gray text-sm font-medium mb-2">State *</label>
                <input 
                  type="text" 
                  value={formData.address.state} 
                  onChange={(e) => handleAddressChange('state', e.target.value)} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                />
              </div>
              <div className="form-group">
                <label className="block text-technical-gray text-sm font-medium mb-2">Pincode *</label>
                <input 
                  type="text" 
                  value={formData.address.pincode} 
                  onChange={(e) => handleAddressChange('pincode', e.target.value)} 
                  required 
                  pattern="\d{6}"
                  maxLength={6}
                  title="Please enter a 6-digit pincode"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="form-group">
              <label className="block text-technical-gray text-sm font-medium mb-2">Project Type</label>
              <select name="projectType" value={formData.projectType} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange bg-white">
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
              <label className="block text-technical-gray text-sm font-medium mb-2">Requirements</label>
              <textarea 
                name="requirements" 
                value={formData.requirements} 
                onChange={handleChange} 
                placeholder="Any specific requirements, measurements you have, or questions about the process?" 
                rows={3} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
              ></textarea>
            </div>
            
            <button type="submit" className="cta-button w-full bg-primary-orange text-white py-3 rounded-lg font-semibold text-lg hover:bg-orange-700 transition-colors flex flex-col items-center justify-center" disabled={isSubmitting}>
              {isSubmitting ? 'Booking...' : 'Book Free Site Visit'}
              <span className="button-subtitle text-sm opacity-80 mt-1">Confirmed instantly</span>
            </button>
          </form>
        </div>
        
        {/* Right Column - Contact Information & Project Details */}
        <div className="booking-calendar lg:w-1/2 bg-white p-8 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Your Preferred Date & Time</h3>
          
          <div className="calendar-widget mb-8">
            <DatePicker
              selected={formData.preferredDateTime instanceof Date ? formData.preferredDateTime : new Date()}
              onChange={handlePreferredDateChange}
              filterDate={filterPassedDates}
              dateFormat="MMMM d, yyyy h:mm aa"
              showTimeSelect
              timeFormat="h:mm aa"
              timeIntervals={30}
              minDate={new Date()}
              inline
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
            />
          </div>

          <div className="form-group mt-4">
            <label className="block text-technical-gray text-sm font-medium mb-2">Alternate Date & Time (Optional)</label>
            <DatePicker
              selected={formData.alternateDateTime}
              onChange={handleAlternateDateChange}
              filterDate={filterPassedDates}
              dateFormat="MMMM d, yyyy h:mm aa"
              showTimeSelect
              timeFormat="h:mm aa"
              timeIntervals={30}
              minDate={new Date()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
              placeholderText="Select an alternate date and time"
            />
          </div>
          
        </div>
       
      </div>
    </section>
  );
};

export default BookingFormSection;

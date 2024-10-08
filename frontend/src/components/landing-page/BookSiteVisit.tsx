"use client";

import { useState, useEffect } from "react";
import { CTAButton } from "./CTAButton"; // Adjust the import path if necessary
import DatePicker from "react-datepicker"; // Make sure to install react-datepicker
import "react-datepicker/dist/react-datepicker.css"; // Include the datepicker CSS

interface DesignerQuestionnaireProps {
  onSubmit: (formData: any) => void;
}

const BookSiteVisit: React.FC<DesignerQuestionnaireProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    projectName: "",
    projectAddress: "",
    projectLocation: "",
    name: "",
    phone: "",
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

  // Update the handler to accept 'null' for DatePicker
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({ ...prev, preferredSlot: date }));
    }
  };

  const validateContactDetails = () => {
    const { phone } = formData;
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContactDetails()) {
      alert("Please enter a valid phone number");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/site-visit/book`, {
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
    return currentDate > today; // Ensures only dates after today can be selected
  };

  if (submitStatus === 'success') {
    return (
      <div className="flex justify-center items-center bg-gray-100 h-screen">
        <div className="w-full max-w-xl p-6 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-theme-color text-4xl font-bold mb-4">Success!</h1>
          <p className="text-dark-color-bw text-xl mb-6">Your site visit has been booked successfully.</p>
          <CTAButton text="Back to Home" onClick={() => {/* Add navigation logic */}} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center bg-gray-100">
      <div className="my-24 w-full max-w-xl p-6 bg-white rounded-lg shadow-md relative">
        <h1 className="text-theme-color text-4xl md:text-5xl font-bold tracking-tight md:tracking-tighter leading-tight mb-10 mt-8 text-center">
          Book a Free Site Visit
        </h1>
        {submitStatus === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-dark-color-bw text-xl md:text-2xl font-bold tracking-tight md:tracking-tighter leading-tight py-5 text-left">
            Contact Information
          </h2>
          <div>
            <label className="block text-theme-secondary mb-2">Name</label>
            <input
              type="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
            />
          </div>
          <div>
            <label className="block text-theme-secondary mb-2">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              maxLength={10}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
            />
          </div>

          <h2 className="text-dark-color-bw text-xl md:text-2xl font-bold tracking-tight md:tracking-tighter leading-tight py-5 text-left">
            Project Details
          </h2>
          <div>
            <label className="block text-theme-secondary mb-2">Project Name</label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
            />
          </div>
          <div>
            <label className="block text-theme-secondary mb-2">Project Address</label>
            <input
              type="text"
              name="projectAddress"
              value={formData.projectAddress}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
            />
          </div>
          <div>
            <label className="block text-theme-secondary mb-2">Project Location</label>
            <input
              type="text"
              name="projectLocation"
              value={formData.projectLocation}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
            />
          </div>

          {/* Date and Time Picker */}
          <h2 className="text-dark-color-bw text-xl md:text-2xl font-bold tracking-tight md:tracking-tighter leading-tight py-5 text-left">
            Select Preferred Slot
          </h2>
          <div>
            <label className="block text-theme-secondary mb-2">Preferred Date and Time</label>
            <DatePicker
              selected={formData.preferredSlot instanceof Date ? formData.preferredSlot : new Date()} // Ensure valid date is passed
              onChange={handleDateChange}
              showTimeSelect
              timeIntervals={30}
              filterTime={filterPassedTime}
              filterDate={filterPassedDates}
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={new Date()}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-right items-right">
            <div className="flex space-x-4">
              <CTAButton type="submit" text="Submit" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookSiteVisit;

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
    preferredSlot: new Date(), // Ensure it's initialized with a Date object
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContactDetails()) {
      alert("Please enter a valid phone number");
      return;
    }
    onSubmit(formData);
    localStorage.removeItem("formData");
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

  return (
    <div className="flex justify-center items-center bg-gray-100">
      <div className="my-24 w-full max-w-xl p-6 bg-white rounded-lg shadow-md relative">
        <h1 className="text-theme-color text-4xl md:text-5xl font-bold tracking-tight md:tracking-tighter leading-tight mb-10 mt-8 text-center">
          Book a Free Site Visit
        </h1>

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
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <CTAButton type="submit" text="Next" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookSiteVisit;

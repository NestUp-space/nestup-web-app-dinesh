"use client";

import { useState, useEffect } from "react";
import HeroBookingSection from "./HeroBookingSection";
import VisitProcessSection from "./VisitProcessSection";
import BookingFormSection from "./BookingFormSection";
import SocialProofSection from "./SocialProofSection";
import FaqSection from "./FaqSection";
import BookingUrgencySection from "./BookingUrgencySection";

interface DesignerQuestionnaireProps {
  onSubmit: (formData: any) => void;
}

const BookSiteVisit: React.FC<DesignerQuestionnaireProps> = ({ onSubmit }) => {
  return (
    <main>
      <HeroBookingSection />
      <VisitProcessSection />
      <BookingFormSection onSubmit={onSubmit} />
      <SocialProofSection />
      <FaqSection />
      <BookingUrgencySection />
    </main>
  );
};

export default BookSiteVisit;

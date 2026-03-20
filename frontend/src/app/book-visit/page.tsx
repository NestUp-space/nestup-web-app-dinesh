"use client"
import { Footer } from "@/components/layout/Footer";
import BookSiteVisit from "@/components/landing-page/BookSiteVisit";

const DesignerPage = () => {
  const handleSubmit = (formData: any) => {
    console.log('Form Data Submitted:', formData);
    // You can send this data to the backend via API
  };

  return (
    <div className="mt-24">
      <BookSiteVisit onSubmit={handleSubmit} />
      <Footer/>
    </div>
  );
};

export default DesignerPage;

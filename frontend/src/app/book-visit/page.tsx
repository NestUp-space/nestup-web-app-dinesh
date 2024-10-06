"use client"
import { Footer } from "@/components/landing-page/Footer";
import Navbar from "@/components/landing-page/Navbar";
import BookSiteVisit from "@/components/landing-page/BookSiteVisit";

const DesignerPage = () => {
  const handleSubmit = (formData: any) => {
    console.log('Form Data Submitted:', formData);
    // You can send this data to the backend via API
  };

  return (
    <div>
      <Navbar/>
      <BookSiteVisit onSubmit={handleSubmit} />
      <Footer/>
    </div>
  );
};

export default DesignerPage;

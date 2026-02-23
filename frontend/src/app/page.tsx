import type { Metadata } from "next";
import { HomeSection } from "@components/landing-page/HomeSection";

export const metadata: Metadata = {
  title: "Home",
  description: "Nestup.space — Designer modular furniture manufacturing. Camera-based room scanning, 3D visualization, and automated manufacturing.",
};
import ProcessSection from "@components/landing-page/ProcessSection";
import { Footer } from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import FAQ from "@components/landing-page/Faq";
import ReviewSection from "@/components/landing-page/ReviewSection";
import ServiceSection from "@/components/landing-page/ServiceSection";
import ProjectSection from "@/components/landing-page/ProjectSection";


export default function Home() {
  return (
    <div className="w-screen">
      <div className="h-24 top-0 fixed bg-white z-50">
         <Navbar />
      </div>
      <div className="mt-24">
      <HomeSection />
      <ReviewSection />
      <ServiceSection />
      <ProjectSection />
      <ProcessSection />
      <FAQ/>
      <Footer/>
      </div>
    </div>
  );
}

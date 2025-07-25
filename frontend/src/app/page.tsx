import { HomeSection } from "@components/landing-page/HomeSection";
import ProcessSection from "@components/landing-page/ProcessSection";
import { Footer } from "@/components/landing-page/Footer";
import Navbar from "@/components/landing-page/Navbar";
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

import { HomeSection } from "@components/HomeSection";
import { ProcessSection } from "@components/ProcessSection";
import { Footer } from "@/components/Footer";
import Navbar from "@/components/Navbar";


export default function Home() {
  return (
    <div className="w-screen">
      <div className="h-24 top-0 fixed bg-white z-50">
         <Navbar />
      </div>
      <div className="mt-24">
      <HomeSection />
      <ProcessSection />
      <Footer/>
      </div>
    </div>
  );
}

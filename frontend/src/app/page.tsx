import dynamic from 'next/dynamic';
import { HomeSection } from "@components/landing-page/HomeSection";
import Navbar from "@/components/landing-page/Navbar";
import ReviewSection from "@/components/landing-page/ReviewSection";

const ServiceSection = dynamic(
  () => import('@/components/landing-page/ServiceSection').then((m) => m.default),
  { ssr: true, loading: () => <div className="min-h-[320px] bg-white" /> }
);
const ProjectSection = dynamic(
  () => import('@/components/landing-page/ProjectSection').then((m) => m.default),
  { ssr: true, loading: () => <div className="min-h-[400px] bg-gray-50" /> }
);
const ProcessSection = dynamic(
  () => import('@/components/landing-page/ProcessSection').then((m) => m.default),
  { ssr: true, loading: () => <div className="min-h-[480px] bg-white" /> }
);
const FAQ = dynamic(
  () => import('@/components/landing-page/Faq').then((m) => m.default),
  { ssr: true, loading: () => <div className="min-h-[300px] bg-gray-50" /> }
);
const Footer = dynamic(
  () => import('@/components/landing-page/Footer').then((m) => ({ default: m.Footer })),
  { ssr: true, loading: () => <div className="min-h-[200px] bg-gray-900" /> }
);

export default function Home() {
  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 w-full h-24 bg-white z-50">
        <Navbar />
      </div>
      <div className="mt-24 w-full">
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

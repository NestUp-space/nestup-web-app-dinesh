"use client"
import { Footer } from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

const Contact = () => {

  return ( 
    <div className="h-full">
      <div className="h-24 top-0 fixed bg-white z-50">
         <Navbar />
      </div>
      <section className="index-section mt-24" id="contact">
        <div className="sectionheader">
          <h1>About Us</h1>
        </div>
        <div className="connect">
          <div id="contactus" className="googleform">
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLSez5yfaHEyljN163WdeDsCY_jLPEknFSw_YB3z90EOfpFtROQ/viewform?embedded=true"
              width="640"
              height="900"
            ></iframe>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
};

export default Contact

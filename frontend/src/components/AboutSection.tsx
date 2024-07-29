import React from "react";

export function AboutSection() {
  return (
    <section className="index-section" id="contact">
      <div className="sectionheader">
        <h1>About Us</h1>
      </div>
      <div className="connect">
        <div className="about">
          <a href="https://g.co/kgs/zBdf4wa">NestUp Space Modular Factory</a>
          <p>
            BHEL Ancillary Industrial Estate, Bharat Heavy Electricals Limited, Hyderabad, Telangana 502032
          </p>
          <p>
            Contact us - 8885563262, team@nestup.space
          </p>
        </div>
        <div id="contactus" className="googleform">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSez5yfaHEyljN163WdeDsCY_jLPEknFSw_YB3z90EOfpFtROQ/viewform?embedded=true"
            width="640"
            height="900"
          ></iframe>
        </div>
      </div>
    </section>
  );
}

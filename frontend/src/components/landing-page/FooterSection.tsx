// frontend/src/components/landing-page/FooterSection.tsx

"use client";
import React from 'react';

const FooterSection = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sitemap */}
          <div>
            <h3 className="text-lg font-bold mb-4">Sitemap</h3>
            <ul>
              <li>
                <a href="#" className="hover:text-gray-300">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300">
                  Projects
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300">
                  Process
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300">
                  Blogs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          {/* Socials */}
          <div>
            <h3 className="text-lg font-bold mb-4">Socials</h3>
            <ul>
              <li>
                <a href="#" className="hover:text-gray-300">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <p>
              NestUp Space Modular Factory BHEL Ancillary Industrial Estate,
              Bharat Heavy Electricals Limited, Hyderabad, Telangana 502032
            </p>
            <p>+91 88855 63262</p>
            <p>team@nestup.space</p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm">
            © 2025 Nest Up Space. All rights reserved.
          </p>
          <a href="#" className="text-sm hover:text-gray-300">
            Privacy Policy
          </a>
          <a href="#" className="text-sm hover:text-gray-300 ml-4">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

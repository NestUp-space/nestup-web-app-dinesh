"use client";
import Link from "next/link";
import Image from "next/legacy/image";

import Logo from "@img/NestupLogoText.svg";
import CallToActionSection from "@/components/landing-page/CallToActionSection";
import instaLogo from "@img/icons8-instagram.svg";
import NavLink from "@/components/landing-page/Navlink";
import { links } from "@constants/navLinks";

export function Footer() {
  return (
    <div className="h-auto bg-white bottom-0 p-1">
      <CallToActionSection />
      <div className="bg-[#FDEBD0] p-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* LOGO */}
          <div className="w-36 justify-center px-2">
            <Link href="/" className="flex h-12 ">
              <Image
                src={Logo}
                alt="logo"
                className="relative max-h-full object-contain hover:cursor-pointer"
              />
            </Link>
          </div>

          {/* Link Sections */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2 text-gray-600">
                {links.map((link) => (
                  <li key={link.title}>
                    <NavLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Blogs</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/resources/technical-mastery" className="hover:text-orange-500 text-left">
                    Technical Mastery
                  </Link>
                </li>
                <li>
                  <Link href="/resources/design-workflow" className="hover:text-orange-500 text-left">
                    Design Workflow
                  </Link>
                </li>
                <li>
                  <Link href="/resources/project-management" className="hover:text-orange-500 text-left">
                    Project Management
                  </Link>
                </li>
                <li>
                  <Link href="/resources/business-growth" className="hover:text-orange-500 text-left">
                    Business Growth
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/resources/tools/material-configurator" className="hover:text-orange-500 text-left">
                    Material Configurator
                  </Link>
                </li>
                <li>
                  <Link href="/resources/tools/cost-calculator" className="hover:text-orange-500 text-left">
                    Cost Calculator
                  </Link>
                </li>
                <li>
                  <Link href="/resources/tools/cad-library" className="hover:text-orange-500 text-left">
                    CAD Library
                  </Link>
                </li>
                <li>
                  <Link href="/resources/tools/templates" className="hover:text-orange-500 text-left">
                    Templates
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-theme-dark">
            <p className="font-semibold">WANT TO TALK TO US?</p>
            <p className="text-2xl my-3">team@nestup.space</p>
            <a href="https://g.co/kgs/zBdf4wa" className="font-semibold">NestUp Space Modular Factory</a>
            <p>BHEL Ancillary Industrial Estate,</p>
            <p>Bharat Heavy Electricals Limited, Hyderabad, Telangana - 502032</p>
            <p className="mt-3">Contact us - 8885563262</p>
            <div className="flex gap-2 m-2">
              <div className="bg-white p-1 rounded-full">
                <Link href="https://www.instagram.com/nestup.space/" target="_blank">
                  <Image src={instaLogo} alt="instagram logo" height={30} width={30} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#F39C12] text-white p-4 text-center md:flex md:justify-between md:px-10">
        <p>© 2024 Nestup.space All rights reserved.</p>
        <Link href="/privacypolicy">
          <span className="hover:text-gray-200 hover:cursor-pointer">
            Privacy Policy
          </span>
        </Link>
      </div>
    </div>
  );
}

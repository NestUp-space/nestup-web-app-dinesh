import React from "react";
import Image from "next/image";
import Logo from "../img/NestupLogoText.png";
import userIcon from "../img/user.svg"; // Ensure you have the correct path
import menu from "../img/menu.svg"; // Ensure you have the correct path

export function Navbar() {
  return (
    <nav className="flex w-full items-center justify-between px-5 py-1.5 h-[7vh] bg-gray-100">
      <div className="flex items-center h-full lg:container lg:mx-auto">
        <Image src={Logo} alt="Logo" layout="intrinsic" objectFit="contain" className="relative w-auto max-h-full" />
      </div>
      <div className="flex items-center gap-x-5">
        <div className="flex items-center gap-x-2">
          <Image src={userIcon} alt="User Profile" layout="intrinsic" objectFit="contain" className="max-h-full" />
          <span className="hidden font-medium text-[#36485c] lg:block">Sign in</span>
        </div>
        <div>
          <Image src={menu} alt="Menu" layout="intrinsic" objectFit="contain" className="max-h-full" />
        </div>
      </div>
    </nav>
  );
}

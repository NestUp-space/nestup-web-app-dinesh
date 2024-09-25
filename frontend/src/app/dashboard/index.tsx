"use client";

import { useRef } from "react";

const Process = () => {
  const containerRef = useRef<HTMLDivElement>(null); // Define the ref with the correct type

  return (
    <div ref={containerRef}> {/* Corrected JSX syntax */}
      <p>Dashboard</p> {/* Dashboard content */}
    </div>
  );
};

export default Process;

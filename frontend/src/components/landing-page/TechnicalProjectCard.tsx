"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Material {
  name: string;
  type: string;
  finish: string;
  thickness: string;
}

interface Hardware {
  name: string;
  brand: string;
  specification: string;
}

interface TechnicalProject {
  id: string;
  title: string;
  category: 'bedroom' | 'kitchen' | 'living' | 'office';
  images: {
    primary: string;
    before?: string;
    after?: string;
    technical: string[];
  };
  specifications: {
    materials: Material[];
    timeline: string;
    complexity: 'standard' | 'complex' | 'premium';
    hardware: Hardware[];
  };
  caseStudy: {
    challenge: string;
    solution: string;
    outcome: string;
  };
}

interface TechnicalProjectCardProps {
  project: TechnicalProject;
}

export function TechnicalProjectCard({ project }: TechnicalProjectCardProps) {
  const [showTechnicalOverlay, setShowTechnicalOverlay] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'standard': return 'bg-accent-green/10 text-accent-green';
      case 'complex': return 'bg-primary-orange/10 text-primary-orange';
      case 'premium': return 'bg-primary-blue/10 text-primary-blue';
      default: return 'bg-technical-gray/10 text-technical-gray';
    }
  };

  return (
    <>
      <div 
        className="group relative bg-white rounded-dls-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Main Image */}
        <div className="relative h-64 overflow-hidden">
          <Image
            src={project.images.primary}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <h4 className="text-white font-bold text-lg">View Technical Details</h4>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-primary-blue">{project.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getComplexityColor(project.specifications.complexity)}`}>
              {project.specifications.complexity.toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-technical-gray font-body">
            <p><span className="font-sans font-semibold text-neutral-dark">Category:</span> {project.category}</p>
            <p><span className="font-sans font-semibold text-neutral-dark">Timeline:</span> {project.specifications.timeline}</p>
            <p><span className="font-sans font-semibold text-neutral-dark">Main Material:</span> {project.specifications.materials[0]?.name || 'Multiple'}</p>
          </div>

          <Button 
            onClick={() => setIsModalOpen(true)}
            variant="secondary"
            className="mt-4 w-full"
          >
            View Case Study
          </Button>
        </div>
      </div>

      {/* Detailed Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-primary-blue">{project.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Image Gallery */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative h-64 rounded-lg overflow-hidden col-span-2 md:col-span-4">
                <Image
                  src={project.images.primary}
                  alt={`${project.title} - Primary`}
                  fill
                  className="object-cover"
                />
              </div>
              {project.images.technical.slice(0, 3).map((img, index) => (
                <div key={index} className="relative h-32 rounded-lg overflow-hidden">
                  <Image
                    src={img}
                    alt={`${project.title} - Technical ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Technical Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Materials */}
              <div>
                <h4 className="text-xl font-bold text-primary-blue mb-3">Materials Used</h4>
                <div className="space-y-2">
                  {project.specifications.materials.map((material, index) => (
                    <div key={index} className="bg-neutral-light p-3 rounded-dls-md border border-gray-200">
                      <p className="font-sans font-semibold text-neutral-dark">{material.name}</p>
                      <p className="text-sm text-technical-gray font-mono">
                        {material.type} • {material.finish} • {material.thickness}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardware */}
              <div>
                <h4 className="text-xl font-bold text-primary-blue mb-3">Hardware Components</h4>
                <div className="space-y-2">
                  {project.specifications.hardware.map((hardware, index) => (
                    <div key={index} className="bg-neutral-light p-3 rounded-dls-md border border-gray-200">
                      <p className="font-sans font-semibold text-neutral-dark">{hardware.name}</p>
                      <p className="text-sm text-technical-gray font-mono">
                        {hardware.brand} • {hardware.specification}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Case Study */}
            <div>
              <h4 className="text-xl font-bold text-primary-blue mb-3">Case Study</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-500/10 p-4 rounded-dls-md">
                  <h5 className="font-sans font-bold text-red-700 mb-2">Challenge</h5>
                  <p className="text-sm text-red-900 font-body">{project.caseStudy.challenge}</p>
                </div>
                <div className="bg-primary-blue/10 p-4 rounded-dls-md">
                  <h5 className="font-sans font-bold text-primary-blue mb-2">Solution</h5>
                  <p className="text-sm text-neutral-dark font-body">{project.caseStudy.solution}</p>
                </div>
                <div className="bg-accent-green/10 p-4 rounded-dls-md">
                  <h5 className="font-sans font-bold text-accent-green mb-2">Outcome</h5>
                  <p className="text-sm text-green-900 font-body">{project.caseStudy.outcome}</p>
                </div>
              </div>
            </div>

            {/* Project Metrics */}
            <div className="bg-primary-blue/5 p-4 rounded-dls-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary-blue">{project.specifications.timeline}</div>
                  <div className="text-sm text-technical-gray">Completion Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-orange">{project.specifications.materials.length}</div>
                  <div className="text-sm text-technical-gray">Material Types</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-green">{project.specifications.hardware.length}</div>
                  <div className="text-sm text-technical-gray">Hardware Items</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-blue">{project.specifications.complexity.toUpperCase()}</div>
                  <div className="text-sm text-technical-gray">Complexity</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

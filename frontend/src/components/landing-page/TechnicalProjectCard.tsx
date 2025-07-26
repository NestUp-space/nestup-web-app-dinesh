"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

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
      case 'standard': return 'bg-green-100 text-green-800';
      case 'complex': return 'bg-yellow-100 text-yellow-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div 
        className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
        onMouseEnter={() => setShowTechnicalOverlay(true)}
        onMouseLeave={() => setShowTechnicalOverlay(false)}
      >
        {/* Main Image */}
        <div className="relative h-64 overflow-hidden">
          <Image
            src={project.images.primary}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Technical Overlay */}
          {showTechnicalOverlay && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center transition-opacity duration-300">
              <div className="text-white text-center space-y-2 p-4">
                <h4 className="font-semibold text-lg">Technical Specifications</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Timeline:</span> {project.specifications.timeline}</p>
                  <p><span className="font-medium">Materials:</span> {project.specifications.materials.length} types</p>
                  <p><span className="font-medium">Hardware:</span> {project.specifications.hardware.length} components</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-3 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-primary">{project.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(project.specifications.complexity)}`}>
              {project.specifications.complexity.toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-primary">Category:</span> {project.category}</p>
            <p><span className="font-medium text-primary">Timeline:</span> {project.specifications.timeline}</p>
            <p><span className="font-medium text-primary">Materials:</span> {project.specifications.materials[0]?.name || 'Multiple'}</p>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 w-full py-2 border border-primary text-primary hover:bg-primary hover:text-white transition-colors rounded-lg font-medium"
          >
            View Case Study
          </button>
        </div>
      </div>

      {/* Detailed Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">{project.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Image Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative h-64 rounded-lg overflow-hidden">
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
                <h4 className="text-lg font-semibold text-primary mb-3">Materials Used</h4>
                <div className="space-y-2">
                  {project.specifications.materials.map((material, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">{material.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {material.type} • {material.finish} • {material.thickness}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardware */}
              <div>
                <h4 className="text-lg font-semibold text-primary mb-3">Hardware Components</h4>
                <div className="space-y-2">
                  {project.specifications.hardware.map((hardware, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">{hardware.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {hardware.brand} • {hardware.specification}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Case Study */}
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Case Study</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-red-800 mb-2">Challenge</h5>
                  <p className="text-sm text-red-700">{project.caseStudy.challenge}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-800 mb-2">Solution</h5>
                  <p className="text-sm text-blue-700">{project.caseStudy.solution}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-green-800 mb-2">Outcome</h5>
                  <p className="text-sm text-green-700">{project.caseStudy.outcome}</p>
                </div>
              </div>
            </div>

            {/* Project Metrics */}
            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{project.specifications.timeline}</div>
                  <div className="text-sm text-muted-foreground">Completion Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">{project.specifications.materials.length}</div>
                  <div className="text-sm text-muted-foreground">Material Types</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">{project.specifications.hardware.length}</div>
                  <div className="text-sm text-muted-foreground">Hardware Items</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{project.specifications.complexity.toUpperCase()}</div>
                  <div className="text-sm text-muted-foreground">Complexity</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

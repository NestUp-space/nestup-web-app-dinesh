"use client";

import React, { useState } from 'react';
import { TechnicalProjectCard } from './TechnicalProjectCard';

// Enhanced project data with technical specifications
const technicalProjects = [
  {
    id: "bedroom-luxury-suite",
    title: "Luxury Master Bedroom Suite",
    category: "bedroom" as const,
    images: {
      primary: "/img/siteImages/bedroom-1.jpeg",
      technical: [
        "/img/siteImages/Bedroom-2.jpeg",
        "/img/siteImages/Bedroom-3.jpeg",
        "/img/siteImages/Bedroom-4.jpeg"
      ]
    },
    specifications: {
      materials: [
        {
          name: "Premium Plywood",
          type: "BWR Grade",
          finish: "Laminate Veneer",
          thickness: "18mm"
        },
        {
          name: "Solid Wood Edging",
          type: "Teak",
          finish: "Natural Polish",
          thickness: "2mm"
        }
      ],
      timeline: "12 Days",
      complexity: "premium" as const,
      hardware: [
        {
          name: "Soft-Close Hinges",
          brand: "Blum",
          specification: "110° Opening Angle"
        },
        {
          name: "Drawer Slides",
          brand: "Hettich",
          specification: "Full Extension, 40kg Load"
        }
      ]
    },
    caseStudy: {
      challenge: "Client required maximum storage in a compact 12x14 ft bedroom with irregular ceiling height.",
      solution: "Designed floor-to-ceiling wardrobes with custom compartments and integrated study unit to optimize space utilization.",
      outcome: "Achieved 40% more storage than conventional furniture while maintaining aesthetic appeal and functionality."
    }
  },
  {
    id: "kitchen-modern-modular",
    title: "Contemporary Modular Kitchen",
    category: "kitchen" as const,
    images: {
      primary: "/img/siteImages/Kitchen - 1.jpeg",
      technical: [
        "/img/siteImages/Kitchen - 2.jpeg",
        "/img/siteImages/Kitchen - 3.jpeg",
        "/img/siteImages/Kitchen - 4.jpeg"
      ]
    },
    specifications: {
      materials: [
        {
          name: "Marine Plywood",
          type: "BWP Grade",
          finish: "PU Paint",
          thickness: "19mm"
        },
        {
          name: "Quartz Countertop",
          type: "Engineered Stone",
          finish: "Polished",
          thickness: "20mm"
        }
      ],
      timeline: "14 Days",
      complexity: "complex" as const,
      hardware: [
        {
          name: "Tandem Drawers",
          brand: "Hettich",
          specification: "InnoTech, 70kg Load Capacity"
        },
        {
          name: "Corner Solutions",
          brand: "Kesseböhmer",
          specification: "Magic Corner, 360° Access"
        }
      ]
    },
    caseStudy: {
      challenge: "L-shaped kitchen layout with limited counter space and storage requirements for a family of 5.",
      solution: "Implemented vertical storage solutions, pull-out organizers, and corner optimization systems for maximum efficiency.",
      outcome: "Increased storage capacity by 60% and improved workflow efficiency with ergonomic design principles."
    }
  },
  {
    id: "living-entertainment-unit",
    title: "Entertainment & Display Unit",
    category: "living" as const,
    images: {
      primary: "/img/siteImages/livingRoom-1.jpeg",
      technical: [
        "/img/siteImages/livingRoom-2.jpeg",
        "/img/siteImages/livingRoom-3.jpeg",
        "/img/siteImages/livingRoom-4.jpeg"
      ]
    },
    specifications: {
      materials: [
        {
          name: "MDF Board",
          type: "High Density",
          finish: "Acrylic Finish",
          thickness: "18mm"
        },
        {
          name: "LED Strip Housing",
          type: "Aluminum Profile",
          finish: "Anodized",
          thickness: "12mm"
        }
      ],
      timeline: "10 Days",
      complexity: "standard" as const,
      hardware: [
        {
          name: "Push-to-Open",
          brand: "Hafele",
          specification: "Touch Latch System"
        },
        {
          name: "Cable Management",
          brand: "Custom",
          specification: "Integrated Wire Routing"
        }
      ]
    },
    caseStudy: {
      challenge: "Create a modern entertainment center that accommodates 65-inch TV, gaming consoles, and display items while hiding cables.",
      solution: "Designed floating unit with integrated cable management, ambient lighting, and modular shelving system.",
      outcome: "Achieved clean, minimalist aesthetic while providing organized storage for all entertainment equipment and accessories."
    }
  },
  {
    id: "office-workspace",
    title: "Executive Home Office",
    category: "office" as const,
    images: {
      primary: "/img/siteImages/bedroom-1.jpeg", // Using bedroom image as placeholder
      technical: [
        "/img/siteImages/Bedroom-2.jpeg",
        "/img/siteImages/Bedroom-3.jpeg",
        "/img/siteImages/Bedroom-4.jpeg"
      ]
    },
    specifications: {
      materials: [
        {
          name: "Engineered Wood",
          type: "Particle Board",
          finish: "Melamine Laminate",
          thickness: "25mm"
        },
        {
          name: "Glass Shelves",
          type: "Tempered Glass",
          finish: "Clear",
          thickness: "8mm"
        }
      ],
      timeline: "8 Days",
      complexity: "standard" as const,
      hardware: [
        {
          name: "Adjustable Shelves",
          brand: "Hafele",
          specification: "Shelf Support System"
        },
        {
          name: "Desk Hardware",
          brand: "Custom",
          specification: "Height Adjustable Legs"
        }
      ]
    },
    caseStudy: {
      challenge: "Design a productive workspace in a 10x12 ft room that serves dual purpose as guest room.",
      solution: "Created modular desk system with fold-away features and vertical storage to maximize floor space when needed.",
      outcome: "Delivered a professional workspace that transforms into guest accommodation within minutes."
    }
  }
];

const categories = [
  { id: 'all', name: 'All Projects', count: technicalProjects.length },
  { id: 'bedroom', name: 'Bedroom', count: technicalProjects.filter(p => p.category === 'bedroom').length },
  { id: 'kitchen', name: 'Kitchen', count: technicalProjects.filter(p => p.category === 'kitchen').length },
  { id: 'living', name: 'Living Room', count: technicalProjects.filter(p => p.category === 'living').length },
  { id: 'office', name: 'Office', count: technicalProjects.filter(p => p.category === 'office').length }
];

const complexityFilters = [
  { id: 'all', name: 'All Complexity' },
  { id: 'standard', name: 'Standard' },
  { id: 'complex', name: 'Complex' },
  { id: 'premium', name: 'Premium' }
];

const ProjectSection = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedComplexity, setSelectedComplexity] = useState('all');

  const filteredProjects = technicalProjects.filter(project => {
    const categoryMatch = selectedCategory === 'all' || project.category === selectedCategory;
    const complexityMatch = selectedComplexity === 'all' || project.specifications.complexity === selectedComplexity;
    return categoryMatch && complexityMatch;
  });

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Technical Project Portfolio
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore our precision-engineered modular solutions with detailed specifications, 
            material breakdowns, and comprehensive case studies from real designer collaborations.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Category Filter */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Filter by Category</h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white text-primary border border-primary/20 hover:border-primary/40 hover:shadow-md'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>

          {/* Complexity Filter */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Filter by Complexity</h3>
            <div className="flex flex-wrap gap-3">
              {complexityFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedComplexity(filter.id)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    selectedComplexity === filter.id
                      ? 'bg-secondary text-white shadow-lg'
                      : 'bg-white text-secondary border border-secondary/20 hover:border-secondary/40 hover:shadow-md'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-8 text-center">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-primary">{filteredProjects.length}</span> projects
            {selectedCategory !== 'all' && (
              <span> in <span className="font-semibold text-primary">{categories.find(c => c.id === selectedCategory)?.name}</span></span>
            )}
            {selectedComplexity !== 'all' && (
              <span> with <span className="font-semibold text-secondary">{selectedComplexity}</span> complexity</span>
            )}
          </p>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <TechnicalProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* No Results */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-primary mb-2">No Projects Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters to see more projects.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedComplexity('all');
              }}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-primary/10">
            <h3 className="text-2xl font-bold text-primary mb-4">
              Ready to Start Your Project?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our technical team is ready to collaborate on your next modular furniture project. 
              Get detailed specifications, material recommendations, and timeline estimates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/book-visit">
                <button className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
                  Schedule Technical Consultation
                </button>
              </a>
              <a href="/specifications">
                <button className="px-8 py-3 border-2 border-secondary text-secondary hover:bg-secondary hover:text-white transition-colors rounded-lg font-medium">
                  Download Material Catalog
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectSection;

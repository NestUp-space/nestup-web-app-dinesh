# Cline Implementation Prompt - Nestup.space Design Overhaul

## Comprehensive Plan Based on Interior Designer Audit

## Project Overview

Transform Nestup.space from a consumer-focused modular interiors website into a sophisticated, technically-rich platform specifically designed for discerning interior designers. Address critical gaps in technical depth, visual storytelling, and professional information architecture identified in the comprehensive audit.

## Critical Issues to Address (From Audit Report)

### Primary Design Problems

1. **Visual Depth Gap**: Images lack detailed views, before/after shots, close-ups of joinery/finishes
2. **Technical Information Vacuum**: Missing material specifications, hardware brands, construction methods
3. **Process Visualization Inefficiency**: Linear 12-step process hinders quick professional assessment
4. **Missing Designer-Centric Content**: No consolidated professional section
5. **Ambiguous Navigation**: "Dive Deeper" links lack clear professional value
6. **Insufficient Design System**: No formal visual style guide or consistency framework

## Phase 1: Foundation & Design System (Weeks 1-3)

### Task 1.1: Professional Design System Creation

```prompt
Create a sophisticated design system specifically for interior design professionals:

1. **Color Psychology for Designers:**
   - Primary Blue: #1A365D (Trust, technical precision)
   - Secondary Orange: #FF8A00 (Craftsmanship, modular innovation)
   - Accent Green: #22543D (Sustainability, growth)
   - Technical Gray: #4A5568 (Professional specifications)
   - Neutrals: #2D3748, #E2E8F0, #F7FAFC, #FFFFFF
   - Error/Warning states for forms and technical alerts

2. **Typography Hierarchy for Technical Content:**
   - Primary: Inter (Technical clarity, modern professionalism)
   - Secondary: Source Sans Pro (Body text, specifications)
   - Monospace: JetBrains Mono (Technical specs, measurements)
   - Scale: 12px/14px/16px/20px/24px/32px/48px with 1.2-1.6 line heights
   - Technical annotation sizing for diagrams and callouts

3. **Professional Grid System:**
   - 12-column grid with 24px gutters (desktop)
   - Technical content breakpoints: 1440px/1200px/768px/480px
   - Vertical rhythm: 8px base unit for precise alignment
   - Sidebar widths for technical specifications: 320px/280px

4. **Component Tokens:**
   - Border radius: 4px/8px/12px (modern but not trendy)
   - Shadows: Subtle elevation system for technical depth
   - Transitions: 200ms ease-out (professional, not playful)
   - Focus states: High contrast for accessibility

Implement this as a comprehensive CSS custom properties system that reflects the precision interior designers expect.
```

### Task 1.2: Technical Component Library

```prompt
Build component library addressing specific designer needs identified in audit:

1. **Technical Image Components:**
   - Before/After slider with smooth drag interaction
   - Zoom overlay with high-resolution detail views
   - Multi-angle image carousel with thumbnail navigation
   - Technical callout overlay system (materials, dimensions, finishes)
   - Comparison view for multiple projects side-by-side

2. **Professional Card System:**
   - Project showcase cards with technical overlay toggle
   - Material specification cards with downloadable PDFs
   - Process step cards with expandable technical details
   - Testimonial cards with professional credibility indicators

3. **Interactive Documentation:**
   - Expandable specification tables
   - Technical diagram overlays
   - Progressive disclosure for complex information
   - Professional form styling for consultation requests

4. **Navigation Components:**
   - Mega menu specifically for "For Interior Designers" section
   - Breadcrumb system for deep technical content
   - Quick access floating toolbar for key professional resources
   - Mobile-optimized professional menu with technical shortcuts

All components must support the technical depth requirements identified in the audit.
```

## Phase 2: Visual Storytelling Enhancement (Weeks 4-6)

### Task 2.1: Hero Section for Design Professionals

```prompt
Redesign hero section to immediately communicate technical expertise to interior designers:

1. **Professional Value Proposition:**
   - Headline: "Precision Modular Systems for Interior Design Excellence"
   - Subheading: "14-Day Delivery • Technical Specifications • End-to-End Partnership"
   - Key metrics: "500+ Designer Projects • 30+ Material Options • ISO Quality Standards"

2. **Technical Credibility Indicators:**
   - Industry certifications display
   - Quality standards badges (ISO, etc.)
   - Professional association memberships
   - Technical capability highlights

3. **Interactive Modular Showcase:**
   - Animated exploded view of modular construction on page load
   - Hover-triggered technical callouts showing joinery details
   - Material specification overlays with professional data
   - Construction method visualization

4. **Professional CTAs:**
   - Primary: "Schedule Technical Consultation" (not generic "site visit")
   - Secondary: "Download Technical Specifications"
   - Tertiary: "View Designer Portfolio"

5. **Technical Implementation:**
   - CSS Grid for precise layout control
   - CSS animations showcasing modular assembly process
   - Intersection Observer for scroll-triggered technical reveals
   - High-performance WebP images with detailed fallbacks

Address the audit's finding that current visuals lack technical depth for professional evaluation.
```

### Task 2.2: Project Gallery Complete Overhaul

```prompt
Transform basic project images into comprehensive technical showcase addressing audit gaps:

1. **Advanced Project Card Design:**
   - Large primary image with technical overlay toggle
   - Before/after transformation slider
   - Material callout hotspots with specification popups
   - Construction detail zoom areas
   - Project complexity indicators (timeline, custom elements, technical challenges)

2. **Technical Information Integration:**
   - Material specifications panel for each project
   - Construction method details with diagrams
   - Hardware and finish specifications
   - Installation methodology overview
   - Quality control checkpoints achieved

3. **Professional Filtering System:**
   - Filter by: Room type, material category, project complexity, timeline
   - Advanced search: by material type, construction method, designer name
   - Sort by: Recent, complexity, material innovation, timeline
   - Save/bookmark functionality for designer reference

4. **Detailed Project Views:**
   - Modal overlay with comprehensive project documentation
   - Multiple high-resolution angles with zoom capability
   - Technical drawing integration where available
   - Step-by-step construction process visualization
   - Designer testimonial specific to project challenges solved

5. **Case Study Integration:**
   - Dedicated case study pages for complex projects
   - Design challenge identification and solution methodology
   - Material selection rationale and technical justification
   - Timeline breakdown with critical path analysis
   - Quality control and testing documentation

This directly addresses the audit's critical finding that current imagery lacks the detailed views and technical depth designers require.
```

## Phase 3: Process & Technical Documentation (Weeks 7-9)

### Task 3.1: Interactive Process Transformation

```prompt
Replace inefficient linear 12-step process with designer-focused interactive visualization:

1. **Professional Process Overview:**
   - Circular workflow diagram with central quality hub
   - Each step as interactive node with professional icons
   - Parallel process streams showing designer collaboration points
   - Timeline estimates with buffer recommendations for designer planning

2. **Technical Step Details:**
   Each process step must include:
   - Detailed methodology and technical approach
   - Designer collaboration requirements and touchpoints
   - Quality control measures and checkpoints
   - Technical documentation produced at each stage
   - Integration points with designer workflow and project management

3. **Interactive Features:**
   - Hover reveals technical depth without navigation
   - Click expands full technical documentation in side panel
   - Progress tracking for actual projects
   - Customizable view based on project complexity

4. **Designer Integration Points:**
   - Clear indication of when designer input is required
   - Collaboration tools and communication protocols
   - File exchange requirements (CAD, specifications, approvals)
   - Review and approval workflows

5. **Mobile Professional View:**
   - Accordion-style expansion for mobile professionals
   - Quick overview mode for rapid assessment
   - Touch-optimized technical detail access

Address audit finding that linear format prevents designers from quickly grasping entire workflow for compatibility assessment.
```

### Task 3.2: Comprehensive Material Library System

```prompt
Create the missing technical specifications section identified as critical gap in audit:

1. **Material Database Structure:**
   - Wood types: Species, grain patterns, sustainability ratings, workability
   - Laminates: Brands, finish options, durability ratings, maintenance requirements
   - Hardware: Brands, load ratings, finish options, warranty terms
   - Edge banding: Techniques, materials, visual quality grades
   - Adhesives and fasteners: Types, applications, performance specifications

2. **Interactive Material Explorer:**
   - Visual swatch library with high-resolution close-ups
   - Technical specification sheets with downloadable PDFs
   - Material comparison tool for side-by-side analysis
   - Application recommendations based on use case
   - Cost indication ranges for designer budgeting

3. **Professional Features:**
   - Material search by technical properties (durability, moisture resistance, etc.)
   - Specification sheet generator for client presentations
   - Material sample request system
   - Integration with project calculator for cost estimation

4. **Visual Implementation:**
   - Professional catalog-style layout
   - Zoom functionality for texture and grain detail
   - Lighting condition simulator for material appearance
   - Installation and maintenance visual guides

This addresses the audit's identification of missing material specifications as a critical barrier to designer evaluation.
```

## Phase 4: Designer-Focused Professional Portal (Weeks 10-12)

### Task 4.1: Dedicated "For Interior Designers" Portal

```prompt
Create consolidated professional section addressing audit's finding of scattered designer-relevant information:

1. **Portal Landing Page:**
   - Professional value proposition specific to designers
   - Key partnership benefits (technical support, timeline reliability, quality assurance)
   - Success metrics with designer projects and testimonials
   - Quick access to all professional resources and tools

2. **Technical Resource Hub:**
   - Downloadable technical specification library
   - CAD file templates and modular component library
   - Installation guides and technical drawings
   - Quality standards documentation and certifications
   - Material sample request forms

3. **Collaboration Workflow Section:**
   - Detailed partnership process from initial consultation to completion
   - Communication protocols and project management integration
   - File sharing and approval workflow documentation
   - Timeline coordination and dependency management
   - Quality control and sign-off procedures

4. **Professional Tools:**
   - Project cost and timeline calculator
   - Material compatibility checker
   - Technical specification generator
   - Client presentation template downloads
   - Partnership agreement and terms documentation

5. **Designer Success Stories:**
   - Detailed case studies with technical challenges and solutions
   - Professional testimonials with specific project references
   - Before/after portfolio showcasing design problem-solving
   - Partnership success metrics and reliability data

This directly addresses the audit's finding that designers must "search extensively for critical partnership information."
```

### Task 4.2: Enhanced Navigation for Professionals

```prompt
Implement sophisticated navigation addressing "Dive Deeper" ambiguity and professional access needs:

1. **Mega Menu for Designers:**
   - "For Interior Designers" dropdown with visual previews
   - Quick access sections: Materials, Process, Portfolio, Resources
   - Technical documentation shortcuts
   - Direct links to consultation booking and resource downloads

2. **Clear Content Labeling:**
   Replace ambiguous "Dive Deeper" links with specific professional labels:
   - "Technical Specifications & Material Details"
   - "Construction Methods & Quality Standards"
   - "Designer Collaboration Workflow"
   - "Project Timeline & Integration Planning"

3. **Professional Quick Access:**
   - Floating action button for immediate consultation booking
   - Sticky header with designer resource shortcuts
   - Breadcrumb navigation for deep technical content
   - Search functionality with professional terminology

4. **Mobile Professional Navigation:**
   - Compressed but complete professional menu
   - Touch-optimized access to technical resources
   - Quick consultation request form
   - Emergency contact for project support

Address audit findings about deterrent effect of unclear navigation on professional users seeking specific information.
```

## Phase 5: Technical Visualization & Documentation (Weeks 13-15)

### Task 5.1: Technical Diagram Integration System

```prompt
Implement comprehensive technical visualization addressing audit's gap in construction and joinery details:

1. **Exploded View Components:**
   - Interactive 3D-style exploded views of modular connections
   - Layer-by-layer assembly visualization
   - Annotation system for technical specifications
   - Zoom capability for joinery detail examination

2. **Construction Detail Library:**
   - Joint and connection method diagrams
   - Hardware installation specifications
   - Edge banding and finishing technique illustrations
   - Quality control checkpoint visualizations

3. **Interactive Technical Features:**
   - Hover-triggered technical annotations
   - Layer toggle for complex assembly views
   - Measurement callouts with precise dimensions
   - Material cross-reference linking to specification library

4. **Professional Documentation:**
   - Technical drawing standards compliance
   - Downloadable PDF technical sheets
   - CAD file integration preparation
   - Installation sequence documentation

5. **Integration Points:**
   - Embed in project case studies
   - Link from material library specifications
   - Include in process step explanations
   - Reference in FAQ technical answers

This addresses the critical audit finding that technical diagrams and construction details are "largely absent."
```

### Task 5.2: Quality Assessment Visual System

```prompt
Create visual systems allowing designers to assess quality and craftsmanship depth:

1. **Quality Showcase Components:**
   - High-resolution close-up photography of joinery work
   - Surface finish quality comparisons
   - Edge banding precision examples
   - Hardware installation quality standards

2. **Before/After Transformation Gallery:**
   - Project transformation sliders with technical annotations
   - Problem identification and solution visualization
   - Quality improvement documentation
   - Client satisfaction correlation with technical delivery

3. **Technical Achievement Highlights:**
   - Complex project challenge solutions
   - Custom fabrication capabilities demonstration
   - Precision tolerance achievements
   - Innovation in modular construction techniques

4. **Comparative Quality Analysis:**
   - Nestup vs. traditional carpentry quality comparisons
   - Material performance over time documentation
   - Durability testing results and warranties
   - Professional certification and standard compliance

Address audit finding that designers cannot adequately assess quality without detailed visual evidence of craftsmanship.
```

## Phase 6: Mobile-First Professional Optimization (Weeks 16-17)

### Task 6.1: Mobile Professional Experience

```prompt
Optimize entire site for mobile-using interior design professionals:

1. **Mobile-First Technical Content:**
   - Touch-optimized material library browsing with swipe navigation
   - Collapsible technical specification sections
   - Mobile-friendly technical diagram viewing
   - Quick consultation request with professional context

2. **Professional Mobile Features:**
   - One-tap access to technical specifications
   - Mobile-optimized project comparison tools
   - Touch-friendly before/after image sliders
   - Quick material sample request functionality

3. **Performance for Professional Use:**
   - Optimized technical image loading for site visits
   - Offline capability for material specifications
   - Fast technical specification lookup
   - Reliable consultation booking functionality

4. **Mobile Professional Navigation:**
   - Thumb-friendly professional menu system
   - Quick access to emergency project support
   - Mobile-optimized search for technical information
   - Fast switching between technical and overview content

Ensure professional functionality translates perfectly to mobile site visits and field work.
```

## Implementation Priority Matrix

### Critical Path (Weeks 1-6)

1. **Design System Foundation** - Enables all subsequent work
2. **Hero Section Professional Redesign** - First impression for designers
3. **Project Gallery Technical Enhancement** - Core evaluation tool for designers
4. **Material Library Creation** - Critical missing technical information

### High Impact (Weeks 7-12)

5. **Interactive Process Redesign** - Workflow compatibility assessment
6. **Designer Portal Creation** - Consolidated professional resources
7. **Navigation Enhancement** - Professional access and clarity
8. **Technical Documentation Integration** - Construction detail requirements

### Optimization (Weeks 13-17)

9. **Technical Visualization System** - Advanced professional features
10. **Quality Assessment Tools** - Comprehensive evaluation capability
11. **Mobile Professional Optimization** - Field work and site visit support

## Success Metrics Based on Audit Findings

### Technical Content Engagement

- Material library usage: 300% increase
- Technical specification downloads: 500% increase
- Before/after image interaction: 250% increase
- Process detail expansion: 400% increase

### Professional User Behavior

- Designer portal registration: Track adoption
- Technical resource downloads: Monitor usage patterns
- Consultation request quality: More technical inquiries
- Project complexity of inquiries: Higher-value projects

### Design Quality Indicators

- Visual consistency score: 98% across all pages
- Technical content accessibility: WCAG 2.1 AA compliance
- Mobile professional functionality: Perfect responsive experience
- Page load performance: <2 seconds on technical content

## Budget Allocation Based on Audit Priorities

### Phase 1-2 (Foundation & Core): $25,000

- Design system and component library
- Hero redesign and project gallery overhaul
- Critical technical content creation

### Phase 3-4 (Professional Features): $20,000

- Process redesign and material library
- Designer portal and navigation enhancement
- Professional workflow integration

### Phase 5-6 (Advanced & Optimization): $15,000

- Technical visualization system
- Quality assessment tools
- Mobile optimization and performance
**Total Investment: $60,000**

## Risk Mitigation Strategy

### Content Complexity Risk

- Start with existing high-quality projects for detailed documentation
- Prioritize most-requested technical specifications
- Implement progressive enhancement for complex features

### Professional Adoption Risk

- Conduct designer interviews during development phases
- A/B test professional vs. consumer-focused approaches
- Implement analytics to track professional user behavior patterns

### Technical Implementation Risk

- Build responsive foundation first, enhance progressively
- Implement technical features with graceful degradation
- Maintain current functionality while adding professional depth

This comprehensive implementation plan directly addresses every critical issue identified in the audit report while providing actionable technical guidance for Cline implementation. Each task builds upon the previous work to create a cohesive professional platform that serves interior designers' specific evaluation and partnership needs.

Version 2# Cline Implementation Guide - Nestup.space Design Overhaul

## Granular Tasks for Smaller LLM Models

Transform Nestup.space into a professional platform for interior designers through small, focused tasks that can be handled efficiently by smaller LLM models.

---

## PHASE 1: CSS FOUNDATION (Week 1)

### Task 1A: CSS Variables Setup

**File: `styles/variables.css`**

```prompt
Create a CSS variables file with these exact specifications:

1. Create :root selector with these color variables:
   --primary-blue: #1A365D;
   --primary-orange: #FF8A00;
   --accent-green: #22543D;
   --neutral-dark: #2D3748;
   --neutral-light: #F7FAFC;
   --white: #FFFFFF;

2. Add spacing variables:
   --space-xs: 8px;
   --space-sm: 16px;
   --space-md: 24px;
   --space-lg: 48px;
   --space-xl: 72px;

3. Add typography variables:
   --font-primary: 'Inter', sans-serif;
   --font-body: 'Source Sans Pro', sans-serif;
   --font-mono: 'JetBrains Mono', monospace;

Save as variables.css and show me the complete file.
```

### Task 1B: Typography System

**File: `styles/typography.css`**

```prompt
Create typography styles using the variables from variables.css:

1. Import the Google Fonts for Inter, Source Sans Pro, and JetBrains Mono

2. Create these exact heading styles:
   .h1 { font-size: 48px; line-height: 1.2; font-weight: 700; font-family: var(--font-primary); }
   .h2 { font-size: 36px; line-height: 1.3; font-weight: 600; font-family: var(--font-primary); }
   .h3 { font-size: 24px; line-height: 1.4; font-weight: 600; font-family: var(--font-primary); }
   .h4 { font-size: 20px; line-height: 1.4; font-weight: 500; font-family: var(--font-primary); }

3. Create body text styles:
   .body-text { font-size: 16px; line-height: 1.6; font-family: var(--font-body); }
   .caption { font-size: 14px; line-height: 1.5; font-family: var(--font-body); }

Show me the complete typography.css file.
```

### Task 1C: Basic Grid System

**File: `styles/grid.css`**

```prompt
Create a simple CSS Grid system:

1. Create a container class:
   .container { max-width: 1200px; margin: 0 auto; padding: 0 var(--space-md); }

2. Create a 12-column grid:
   .grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--space-md); }

3. Create responsive column classes:
   .col-12 { grid-column: span 12; }
   .col-6 { grid-column: span 6; }
   .col-4 { grid-column: span 4; }
   .col-3 { grid-column: span 3; }

4. Add mobile responsiveness:
   @media (max-width: 768px) {
     .col-6, .col-4, .col-3 { grid-column: span 12; }
   }

Show me the complete grid.css file.
```

---

## PHASE 2: BUTTON COMPONENTS (Week 1)

### Task 2A: Primary Button

**File: `styles/buttons.css`**

```prompt
Create a primary button component:

1. Create .btn-primary class with these styles:
   - Background: var(--primary-orange)
   - Color: var(--white)
   - Padding: 12px 24px
   - Border: none
   - Border-radius: 8px
   - Font-family: var(--font-primary)
   - Font-weight: 600
   - Cursor: pointer

2. Add hover effect:
   - Background darkens by 10%
   - Transition: all 0.2s ease

3. Add focus state for accessibility:
   - Outline: 2px solid var(--primary-blue)
   - Outline-offset: 2px

Show me the complete button CSS.
```

### Task 2B: Secondary Button

**File: Update `styles/buttons.css`**

```prompt
Add a secondary button to the existing buttons.css file:

1. Create .btn-secondary class:
   - Background: transparent
   - Color: var(--primary-blue)
   - Border: 2px solid var(--primary-blue)
   - Same padding and other styles as primary button

2. Add hover effect:
   - Background: var(--primary-blue)
   - Color: var(--white)
   - Transition: all 0.2s ease

3. Include the same focus state as primary button

Show me the updated buttons.css file with both primary and secondary buttons.
```

### Task 2C: CTA Button

**File: Update `styles/buttons.css`**

```prompt
Add a call-to-action button to buttons.css:

1. Create .btn-cta class:
   - Background: linear-gradient(135deg, var(--primary-orange), #FF6B35)
   - Color: var(--white)
   - Padding: 16px 32px (larger than regular buttons)
   - Font-size: 18px
   - Font-weight: 700
   - Box-shadow: 0 4px 15px rgba(255, 138, 0, 0.3)

2. Add hover animation:
   - Transform: translateY(-2px)
   - Box-shadow: 0 6px 20px rgba(255, 138, 0, 0.4)

Show me the complete buttons.css with all three button types.
```

---

## PHASE 3: CARD COMPONENTS (Week 2)

### Task 3A: Basic Project Card

**File: `styles/cards.css`**

```prompt
Create a basic project card component:

1. Create .project-card class:
   - Background: var(--white)
   - Border-radius: 12px
   - Box-shadow: 0 2px 10px rgba(0,0,0,0.1)
   - Overflow: hidden
   - Transition: transform 0.2s ease

2. Add hover effect:
   - Transform: translateY(-4px)
   - Box-shadow: 0 8px 25px rgba(0,0,0,0.15)

3. Create .project-card img style:
   - Width: 100%
   - Height: 200px
   - Object-fit: cover

4. Create .project-card-content style:
   - Padding: var(--space-md)

Show me the complete cards.css file.
```

### Task 3B: Material Card Component

**File: Update `styles/cards.css`**

```prompt
Add a material specification card to the existing cards.css:

1. Create .material-card class:
   - Same base styles as project-card
   - Display: flex
   - Align-items: center
   - Gap: var(--space-md)

2. Create .material-swatch style:
   - Width: 80px
   - Height: 80px
   - Border-radius: 8px
   - Flex-shrink: 0

3. Create .material-info style:
   - Flex: 1

4. Create .material-title style:
   - Margin: 0 0 var(--space-xs) 0
   - Font-weight: 600

Show me the updated cards.css with both card types.
```

### Task 3C: Testimonial Card

**File: Update `styles/cards.css`**

```prompt
Add a testimonial card component to cards.css:

1. Create .testimonial-card class:
   - Background: var(--neutral-light)
   - Border-left: 4px solid var(--primary-orange)
   - Padding: var(--space-lg)
   - Border-radius: 8px

2. Create .testimonial-text style:
   - Font-style: italic
   - Margin-bottom: var(--space-md)
   - Font-size: 16px
   - Line-height: 1.6

3. Create .testimonial-author style:
   - Font-weight: 600
   - Color: var(--primary-blue)

Show me the complete cards.css with all three card types.
```

---

## PHASE 4: HEADER REDESIGN (Week 2)

### Task 4A: Header Structure

**File: `index.html` (header section only)**

```prompt
Create a new header structure in HTML:

1. Replace existing header with this structure:
   <header class="main-header">
     <div class="container">
       <div class="header-content">
         <div class="logo">
           <img src="logo.png" alt="Nestup.space" class="logo-img">
         </div>
         <nav class="main-nav">
           <ul class="nav-list">
             <li><a href="#home">Home</a></li>
             <li><a href="#designers">For Designers</a></li>
             <li><a href="#projects">Projects</a></li>
             <li><a href="#process">How We Work</a></li>
             <li><a href="#about">About</a></li>
           </ul>
         </nav>
         <div class="header-cta">
           <button class="btn-cta">Schedule Consultation</button>
         </div>
       </div>
     </div>
   </header>

Show me just the header HTML structure.
```

### Task 4B: Header Styling

**File: `styles/header.css`**

```prompt
Create styling for the header structure:

1. Create .main-header styles:
   - Background: var(--white)
   - Box-shadow: 0 2px 10px rgba(0,0,0,0.1)
   - Position: sticky
   - Top: 0
   - Z-index: 100

2. Create .header-content styles:
   - Display: flex
   - Align-items: center
   - Justify-content: space-between
   - Padding: var(--space-md) 0

3. Create .logo-img styles:
   - Height: 40px
   - Width: auto

4. Create .nav-list styles:
   - Display: flex
   - List-style: none
   - Gap: var(--space-lg)
   - Margin: 0
   - Padding: 0

5. Create .nav-list a styles:
   - Text-decoration: none
   - Color: var(--neutral-dark)
   - Font-weight: 500
   - Transition: color 0.2s ease

6. Add hover effect for nav links:
   - Color: var(--primary-orange)

Show me the complete header.css file.
```

### Task 4C: Mobile Header

**File: Update `styles/header.css`**

```prompt
Add mobile responsiveness to the header.css file:

1. Add media query for screens smaller than 768px:
   @media (max-width: 768px) { }

2. Inside the media query, add these styles:
   - .header-content { flex-direction: column; gap: var(--space-md); }
   - .main-nav { order: 3; width: 100%; }
   - .nav-list { flex-direction: column; text-align: center; }
   - .header-cta { order: 2; }

3. Add hamburger menu button (mobile only):
   - .mobile-menu-btn { display: none; }
   - Inside media query: .mobile-menu-btn { display: block; }

Show me the updated header.css with mobile styles.
```

---

## PHASE 5: HERO SECTION REDESIGN (Week 3)

### Task 5A: Hero HTML Structure

**File: Update `index.html` (hero section)**

```prompt
Create a new hero section structure after the header:

<section class="hero-section">
  <div class="container">
    <div class="hero-content">
      <div class="hero-text">
        <h1 class="hero-title">Precision Modular Systems for Interior Design Excellence</h1>
        <p class="hero-subtitle">14-Day Delivery • Technical Specifications • End-to-End Partnership</p>
        <div class="hero-metrics">
          <span class="metric">500+ Designer Projects</span>
          <span class="metric">30+ Material Options</span>
          <span class="metric">ISO Quality Standards</span>
        </div>
        <div class="hero-cta">
          <button class="btn-cta">Schedule Technical Consultation</button>
          <button class="btn-secondary">Download Specifications</button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-image">
          <img src="hero-modular.jpg" alt="Modular Interior Construction" class="hero-img">
        </div>
      </div>
    </div>
  </div>
</section>

Show me just the hero section HTML.
```

### Task 5B: Hero Basic Styling

**File: `styles/hero.css`**

```prompt
Create basic styling for the hero section:

1. Create .hero-section styles:
   - Background: linear-gradient(135deg, var(--neutral-light), var(--white))
   - Padding: var(--space-xl) 0

2. Create .hero-content styles:
   - Display: grid
   - Grid-template-columns: 1fr 1fr
   - Gap: var(--space-xl)
   - Align-items: center

3. Create .hero-title styles:
   - Font-size: 48px
   - Font-weight: 700
   - Color: var(--primary-blue)
   - Margin: 0 0 var(--space-md) 0
   - Line-height: 1.2

4. Create .hero-subtitle styles:
   - Font-size: 20px
   - Color: var(--neutral-dark)
   - Margin: 0 0 var(--space-lg) 0

5. Create .hero-img styles:
   - Width: 100%
   - Height: auto
   - Border-radius: 12px

Show me the complete hero.css file.
```

### Task 5C: Hero Metrics and CTA

**File: Update `styles/hero.css`**

```prompt
Add styling for hero metrics and CTA buttons to hero.css:

1. Create .hero-metrics styles:
   - Display: flex
   - Gap: var(--space-lg)
   - Margin: 0 0 var(--space-xl) 0

2. Create .metric styles:
   - Font-size: 14px
   - Font-weight: 600
   - Color: var(--accent-green)
   - Padding: var(--space-xs) var(--space-md)
   - Background: rgba(34, 84, 61, 0.1)
   - Border-radius: 20px

3. Create .hero-cta styles:
   - Display: flex
   - Gap: var(--space-md)
   - Align-items: center

4. Add mobile responsiveness:
   @media (max-width: 768px) {
     .hero-content { grid-template-columns: 1fr; }
     .hero-metrics { flex-direction: column; align-items: flex-start; }
     .hero-cta { flex-direction: column; align-items: stretch; }
   }

Show me the updated hero.css file.
```

---

## PHASE 6: PROJECT GALLERY FOUNDATION (Week 3)

### Task 6A: Project Gallery HTML

**File: Update `index.html` (projects section)**

```prompt
Create a projects gallery section:

<section class="projects-section">
  <div class="container">
    <div class="section-header">
      <h2 class="section-title">Our Technical Projects</h2>
      <p class="section-subtitle">Detailed documentation of modular construction excellence</p>
    </div>
    
    <div class="project-filters">
      <button class="filter-btn active" data-filter="all">All Projects</button>
      <button class="filter-btn" data-filter="bedroom">Bedroom</button>
      <button class="filter-btn" data-filter="kitchen">Kitchen</button>
      <button class="filter-btn" data-filter="living">Living Room</button>
    </div>
    
    <div class="projects-grid">
      <article class="project-card" data-category="bedroom">
        <div class="project-image">
          <img src="project1.jpg" alt="Modern Bedroom Design">
          <div class="project-overlay">
            <button class="btn-primary">View Technical Details</button>
          </div>
        </div>
        <div class="project-info">
          <h3>Modern Modular Bedroom</h3>
          <p>14-day delivery • Custom wardrobe • Quality hardware</p>
        </div>
      </article>
      
      <!-- Add 2 more similar project cards -->
    </div>
  </div>
</section>

Show me just the projects section HTML with 3 project cards.
```

### Task 6B: Project Gallery Basic Styles

**File: `styles/projects.css`**

```prompt
Create basic styling for the projects section:

1. Create .projects-section styles:
   - Padding: var(--space-xl) 0
   - Background: var(--white)

2. Create .section-header styles:
   - Text-align: center
   - Margin-bottom: var(--space-xl)

3. Create .section-title styles:
   - Font-size: 36px
   - Color: var(--primary-blue)
   - Margin: 0 0 var(--space-md) 0

4. Create .section-subtitle styles:
   - Font-size: 18px
   - Color: var(--neutral-dark)
   - Margin: 0

5. Create .projects-grid styles:
   - Display: grid
   - Grid-template-columns: repeat(auto-fit, minmax(350px, 1fr))
   - Gap: var(--space-lg)

Show me the complete projects.css file.
```

### Task 6C: Project Card Interactions

**File: Update `styles/projects.css`**

```prompt
Add interactive elements to the projects.css file:

1. Create .project-image styles:
   - Position: relative
   - Overflow: hidden
   - Border-radius: 12px

2. Create .project-overlay styles:
   - Position: absolute
   - Top: 0
   - Left: 0
   - Right: 0
   - Bottom: 0
   - Background: rgba(26, 54, 93, 0.8)
   - Display: flex
   - Align-items: center
   - Justify-content: center
   - Opacity: 0
   - Transition: opacity 0.3s ease

3. Add hover effect for project cards:
   .project-card:hover .project-overlay { opacity: 1; }

4. Create .project-info styles:
   - Padding: var(--space-md)

5. Create filter button styles:
   .filter-btn {
     background: transparent;
     border: 2px solid var(--primary-blue);
     padding: var(--space-sm) var(--space-md);
     margin: 0 var(--space-xs);
     border-radius: 25px;
     cursor: pointer;
   }
   
   .filter-btn.active {
     background: var(--primary-blue);
     color: var(--white);
   }

Show me the updated projects.css with interactive elements.
```

---

## PHASE 7: MATERIAL LIBRARY FOUNDATION (Week 4)

### Task 7A: Material Library HTML Structure

**File: Create new `materials.html` page**

```prompt
Create a dedicated materials page HTML structure:

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Material Library - Nestup.space</title>
    <link rel="stylesheet" href="styles/variables.css">
    <link rel="stylesheet" href="styles/typography.css">
    <link rel="stylesheet" href="styles/grid.css">
    <link rel="stylesheet" href="styles/buttons.css">
    <link rel="stylesheet" href="styles/cards.css">
    <link rel="stylesheet" href="styles/materials.css">
</head>
<body>
    <main class="materials-page">
        <div class="container">
            <header class="page-header">
                <h1>Technical Material Library</h1>
                <p>Comprehensive specifications for interior design professionals</p>
            </header>
            
            <section class="material-categories">
                <button class="category-btn active" data-category="wood">Wood Types</button>
                <button class="category-btn" data-category="laminate">Laminates</button>
                <button class="category-btn" data-category="hardware">Hardware</button>
            </section>
            
            <section class="materials-grid">
                <!-- Material cards will be populated here -->
            </section>
        </div>
    </main>
</body>
</html>

Show me the complete materials.html file.
```

### Task 7B: Material Card Component

**File: `styles/materials.css`**

```prompt
Create styling for the materials page:

1. Create .materials-page styles:
   - Padding: var(--space-xl) 0
   - Min-height: 100vh

2. Create .page-header styles:
   - Text-align: center
   - Margin-bottom: var(--space-xl)

3. Create .material-categories styles:
   - Display: flex
   - Justify-content: center
   - Gap: var(--space-md)
   - Margin-bottom: var(--space-xl)

4. Create .category-btn styles:
   - Background: var(--neutral-light)
   - Border: none
   - Padding: var(--space-md) var(--space-lg)
   - Border-radius: 8px
   - Font-weight: 600
   - Cursor: pointer
   - Transition: all 0.2s ease

5. Create .category-btn.active styles:
   - Background: var(--primary-orange)
   - Color: var(--white)

6. Create .materials-grid styles:
   - Display: grid
   - Grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))
   - Gap: var(--space-lg)

Show me the complete materials.css file.
```

### Task 7C: Individual Material Cards

**File: Update `materials.html` (add sample materials)**

```prompt
Add sample material cards to the materials-grid section in materials.html:

<div class="materials-grid">
    <div class="material-card" data-category="wood">
        <div class="material-image">
            <img src="wood-oak.jpg" alt="Premium Oak Wood">
        </div>
        <div class="material-details">
            <h3 class="material-name">Premium Oak</h3>
            <div class="material-specs">
                <span class="spec-item">Density: 0.75 g/cm³</span>
                <span class="spec-item">Moisture: 8-12%</span>
                <span class="spec-item">Grade: A+</span>
            </div>
            <button class="btn-secondary">Download Spec Sheet</button>
        </div>
    </div>
    
    <div class="material-card" data-category="laminate">
        <div class="material-image">
            <img src="laminate-white.jpg" alt="High-Gloss White Laminate">
        </div>
        <div class="material-details">
            <h3 class="material-name">High-Gloss White</h3>
            <div class="material-specs">
                <span class="spec-item">Thickness: 1mm</span>
                <span class="spec-item">Finish: High-Gloss</span>
                <span class="spec-item">Brand: Premium</span>
            </div>
            <button class="btn-secondary">Download Spec Sheet</button>
        </div>
    </div>
    
    <div class="material-card" data-category="hardware">
        <div class="material-image">
            <img src="hardware-hinge.jpg" alt="Soft-Close Hinges">
        </div>
        <div class="material-details">
            <h3 class="material-name">Soft-Close Hinges</h3>
            <div class="material-specs">
                <span class="spec-item">Load: 15kg</span>
                <span class="spec-item">Finish: Chrome</span>
                <span class="spec-item">Warranty: 5 years</span>
            </div>
            <button class="btn-secondary">Download Spec Sheet</button>
        </div>
    </div>
</div>

Show me just the materials-grid section with these three cards.
```

---

## PHASE 8: PROCESS REDESIGN FOUNDATION (Week 4)

### Task 8A: Process Section HTML

**File: Update `index.html` (process section)**

```prompt
Create a new process section to replace the existing 12-step process:

<section class="process-section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Our Technical Process</h2>
            <p class="section-subtitle">Systematic approach to modular construction excellence</p>
        </div>
        
        <div class="process-container">
            <div class="process-overview">
                <div class="process-circle">
                    <div class="process-center">
                        <img src="nestup-logo.png" alt="Nestup Process" class="process-logo">
                    </div>
                    <div class="process-step" data-step="1" style="--angle: 0deg">
                        <div class="step-icon">📋</div>
                        <span class="step-label">Consultation</span>
                    </div>
                    <div class="process-step" data-step="2" style="--angle: 60deg">
                        <div class="step-icon">📐</div>
                        <span class="step-label">Measurement</span>
                    </div>
                    <div class="process-step" data-step="3" style="--angle: 120deg">
                        <div class="step-icon">🎨</div>
                        <span class="step-label">Design</span>
                    </div>
                    <div class="process-step" data-step="4" style="--angle: 180deg">
                        <div class="step-icon">✅</div>
                        <span class="step-label">Approval</span>
                    </div>
                    <div class="process-step" data-step="5" style="--angle: 240deg">
                        <div class="step-icon">🏭</div>
                        <span class="step-label">Production</span>
                    </div>
                    <div class="process-step" data-step="6" style="--angle: 300deg">
                        <div class="step-icon">🚚</div>
                        <span class="step-label">Installation</span>
                    </div>
                </div>
            </div>
            
            <div class="process-details">
                <div class="step-detail active" data-step="1">
                    <h3>Technical Consultation</h3>
                    <p>Professional assessment of design requirements and technical specifications.</p>
                    <ul>
                        <li>Site analysis and measurements</li>
                        <li>Material requirement evaluation</li>
                        <li>Timeline and budget planning</li>
                    </ul>
                </div>
                <!-- Add other step details -->
            </div>
        </div>
    </div>
</section>

Show me just the process section HTML structure.
```

### Task 8B: Process Circle Styling

**File: `styles/process.css`**

```prompt
Create styling for the circular process visualization:

1. Create .process-section styles:
   - Padding: var(--space-xl) 0
   - Background: var(--neutral-light)

2. Create .process-container styles:
   - Display: grid
   - Grid-template-columns: 1fr 1fr
   - Gap: var(--space-xl)
   - Align-items: center

3. Create .process-circle styles:
   - Position: relative
   - Width: 400px
   - Height: 400px
   - Margin: 0 auto

4. Create .process-center styles:
   - Position: absolute
   - Top: 50%
   - Left: 50%
   - Transform: translate(-50%, -50%)
   - Width: 100px
   - Height: 100px
   - Background: var(--white)
   - Border-radius: 50%
   - Display: flex
   - Align-items: center
   - Justify-content: center
   - Box-shadow: 0 4px 15px rgba(0,0,0,0.1)

5. Create .process-logo styles:
   - Width: 60px
   - Height: auto

Show me the complete process.css file with these circular layout styles.
```

### Task 8C: Process Step Positioning

**File: Update `styles/process.css`**

```prompt
Add step positioning and interaction to process.css:

1. Create .process-step styles:
   - Position: absolute
   - Top: 50%
   - Left: 50%
   - Transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-180px) rotate(calc(-1 * var(--angle)))
   - Width: 80px
   - Height: 80px
   - Background: var(--white)
   - Border-radius: 50%
   - Display: flex
   - Flex-direction: column
   - Align-items: center
   - Justify-content: center
   - Cursor: pointer
   - Transition: all 0.3s ease
   - Box-shadow: 0 2px 10px rgba(0,0,0,0.1)

2. Create .step-icon styles:
   - Font-size: 24px
   - Margin-bottom: 4px

3. Create .step-label styles:
   - Font-size: 10px
   - Font-weight: 600
   - Text-align: center

4. Add hover effect:
   .process-step:hover {
     transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-180px) rotate(calc(-1 * var(--angle))) scale(1.1);
     box-shadow: 0 4px 20px rgba(0,0,0,0.2);
   }

5. Add mobile responsiveness:
   @media (max-width: 768px) {
     .process-container { grid-template-columns: 1fr; }
     .process-circle { width: 300px; height: 300px; }
   }

Show me the updated process.css with step positioning.
```

---

## PHASE 9: BASIC INTERACTIVITY (Week 5)

### Task 9A: Filter Functionality

**File: `scripts/projects.js`**

```prompt
Create JavaScript for project filtering functionality:

1. Create a simple project filter system:
   - Get all filter buttons and project cards
   - Add click event listeners to filter buttons
   - Show/hide projects based on data-category attribute

2. Write this exact JavaScript code:

document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');

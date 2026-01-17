/**
 * Seed Script for LiDAR Module Templates
 * Run with: npx ts-node src/lidar/scripts/seed-module-templates.ts
 */

import { PrismaClient, ModuleCategory } from '@prisma/client';

const prisma = new PrismaClient();

const moduleTemplates = [
  // Kitchen Modules
  {
    name: 'Base Cabinet',
    category: ModuleCategory.KITCHEN,
    description: 'Standard kitchen base cabinet with adjustable shelves',
    thumbnailUrl: '/assets/modules/kitchen-base-cabinet.png',
    defaultDimensions: { width: 600, height: 850, depth: 560 },
    constraints: {
      minWidth: 300,
      maxWidth: 1200,
      minHeight: 700,
      maxHeight: 900,
      minDepth: 400,
      maxDepth: 650,
    },
    parameters: {
      shelfCount: 1,
      hasDoor: true,
      doorStyle: 'shaker',
    },
    placementRules: {
      allowedSurfaces: ['wall', 'floor'],
      minHeightFromFloor: 0,
      maxHeightFromFloor: 0,
    },
  },
  {
    name: 'Wall Cabinet',
    category: ModuleCategory.KITCHEN,
    description: 'Kitchen wall-mounted cabinet with glass or solid doors',
    thumbnailUrl: '/assets/modules/kitchen-wall-cabinet.png',
    defaultDimensions: { width: 600, height: 720, depth: 350 },
    constraints: {
      minWidth: 300,
      maxWidth: 1200,
      minHeight: 400,
      maxHeight: 900,
      minDepth: 250,
      maxDepth: 400,
    },
    parameters: {
      shelfCount: 2,
      hasDoor: true,
      doorStyle: 'shaker',
      hasGlass: false,
    },
    placementRules: {
      allowedSurfaces: ['wall'],
      minHeightFromFloor: 1350,
      maxHeightFromFloor: 1500,
    },
  },
  {
    name: 'Tall Cabinet',
    category: ModuleCategory.KITCHEN,
    description: 'Full-height kitchen cabinet for pantry or appliances',
    thumbnailUrl: '/assets/modules/kitchen-tall-cabinet.png',
    defaultDimensions: { width: 600, height: 2100, depth: 560 },
    constraints: {
      minWidth: 450,
      maxWidth: 900,
      minHeight: 1800,
      maxHeight: 2400,
      minDepth: 400,
      maxDepth: 650,
    },
    parameters: {
      shelfCount: 5,
      hasDoor: true,
      doorStyle: 'shaker',
    },
    placementRules: {
      allowedSurfaces: ['wall', 'floor'],
      minHeightFromFloor: 0,
      maxHeightFromFloor: 0,
    },
  },

  // Wardrobe Modules
  {
    name: 'Wardrobe - Hanging',
    category: ModuleCategory.WARDROBE,
    description: 'Wardrobe module with hanging rod',
    thumbnailUrl: '/assets/modules/wardrobe-hanging.png',
    defaultDimensions: { width: 900, height: 2200, depth: 600 },
    constraints: {
      minWidth: 600,
      maxWidth: 1200,
      minHeight: 1800,
      maxHeight: 2600,
      minDepth: 500,
      maxDepth: 700,
    },
    parameters: {
      hasHangingRod: true,
      rodHeight: 1800,
      hasShelf: true,
    },
    placementRules: {
      allowedSurfaces: ['wall', 'floor'],
      minHeightFromFloor: 0,
      maxHeightFromFloor: 0,
    },
  },
  {
    name: 'Wardrobe - Shelves',
    category: ModuleCategory.WARDROBE,
    description: 'Wardrobe module with adjustable shelves',
    thumbnailUrl: '/assets/modules/wardrobe-shelves.png',
    defaultDimensions: { width: 600, height: 2200, depth: 600 },
    constraints: {
      minWidth: 400,
      maxWidth: 900,
      minHeight: 1800,
      maxHeight: 2600,
      minDepth: 500,
      maxDepth: 700,
    },
    parameters: {
      shelfCount: 6,
      adjustableShelf: true,
    },
    placementRules: {
      allowedSurfaces: ['wall', 'floor'],
      minHeightFromFloor: 0,
      maxHeightFromFloor: 0,
    },
  },
  {
    name: 'Wardrobe - Drawers',
    category: ModuleCategory.WARDROBE,
    description: 'Wardrobe module with soft-close drawers',
    thumbnailUrl: '/assets/modules/wardrobe-drawers.png',
    defaultDimensions: { width: 600, height: 800, depth: 600 },
    constraints: {
      minWidth: 400,
      maxWidth: 900,
      minHeight: 400,
      maxHeight: 1200,
      minDepth: 500,
      maxDepth: 700,
    },
    parameters: {
      drawerCount: 4,
      softClose: true,
    },
    placementRules: {
      allowedSurfaces: ['wall', 'floor'],
      minHeightFromFloor: 0,
      maxHeightFromFloor: 0,
    },
  },

  // Storage Modules
  {
    name: 'Bookshelf',
    category: ModuleCategory.STORAGE,
    description: 'Open bookshelf with adjustable shelves',
    thumbnailUrl: '/assets/modules/bookshelf.png',
    defaultDimensions: { width: 800, height: 1800, depth: 350 },
    constraints: {
      minWidth: 400,
      maxWidth: 1200,
      minHeight: 900,
      maxHeight: 2400,
      minDepth: 250,
      maxDepth: 450,
    },
    parameters: {
      shelfCount: 5,
      backPanel: true,
      openDesign: true,
    },
    placementRules: {
      allowedSurfaces: ['wall', 'floor'],
      minHeightFromFloor: 0,
      maxHeightFromFloor: 0,
    },
  },
  {
    name: 'TV Unit',
    category: ModuleCategory.LIVING,
    description: 'Entertainment unit with cable management',
    thumbnailUrl: '/assets/modules/tv-unit.png',
    defaultDimensions: { width: 1800, height: 500, depth: 450 },
    constraints: {
      minWidth: 1200,
      maxWidth: 2400,
      minHeight: 350,
      maxHeight: 700,
      minDepth: 350,
      maxDepth: 550,
    },
    parameters: {
      hasDoors: true,
      hasDrawers: true,
      cableHoles: true,
    },
    placementRules: {
      allowedSurfaces: ['wall', 'floor'],
      minHeightFromFloor: 0,
      maxHeightFromFloor: 300,
    },
  },
  {
    name: 'Floating Shelf',
    category: ModuleCategory.STORAGE,
    description: 'Wall-mounted floating shelf',
    thumbnailUrl: '/assets/modules/floating-shelf.png',
    defaultDimensions: { width: 900, height: 50, depth: 250 },
    constraints: {
      minWidth: 400,
      maxWidth: 1500,
      minHeight: 30,
      maxHeight: 100,
      minDepth: 150,
      maxDepth: 350,
    },
    parameters: {
      bracketType: 'concealed',
      maxLoad: 30,
    },
    placementRules: {
      allowedSurfaces: ['wall'],
      minHeightFromFloor: 500,
      maxHeightFromFloor: 2000,
    },
  },

  // Bathroom Modules
  {
    name: 'Vanity Cabinet',
    category: ModuleCategory.BATHROOM,
    description: 'Bathroom vanity with sink cutout',
    thumbnailUrl: '/assets/modules/bathroom-vanity.png',
    defaultDimensions: { width: 750, height: 850, depth: 500 },
    constraints: {
      minWidth: 500,
      maxWidth: 1500,
      minHeight: 700,
      maxHeight: 950,
      minDepth: 400,
      maxDepth: 600,
    },
    parameters: {
      hasSinkCutout: true,
      hasDoors: true,
      hasDrawers: false,
    },
    placementRules: {
      allowedSurfaces: ['wall', 'floor'],
      minHeightFromFloor: 0,
      maxHeightFromFloor: 0,
    },
  },
  {
    name: 'Mirror Cabinet',
    category: ModuleCategory.BATHROOM,
    description: 'Mirrored medicine cabinet',
    thumbnailUrl: '/assets/modules/mirror-cabinet.png',
    defaultDimensions: { width: 600, height: 700, depth: 150 },
    constraints: {
      minWidth: 400,
      maxWidth: 1200,
      minHeight: 500,
      maxHeight: 900,
      minDepth: 100,
      maxDepth: 200,
    },
    parameters: {
      hasMirror: true,
      hasLED: true,
      shelfCount: 2,
    },
    placementRules: {
      allowedSurfaces: ['wall'],
      minHeightFromFloor: 1100,
      maxHeightFromFloor: 1400,
    },
  },

  // Office Modules
  {
    name: 'Study Desk',
    category: ModuleCategory.OFFICE,
    description: 'Work desk with cable management',
    thumbnailUrl: '/assets/modules/study-desk.png',
    defaultDimensions: { width: 1200, height: 750, depth: 600 },
    constraints: {
      minWidth: 900,
      maxWidth: 1800,
      minHeight: 700,
      maxHeight: 800,
      minDepth: 500,
      maxDepth: 800,
    },
    parameters: {
      hasDrawers: true,
      drawerCount: 3,
      cableGrommet: true,
    },
    placementRules: {
      allowedSurfaces: ['wall', 'floor'],
      minHeightFromFloor: 0,
      maxHeightFromFloor: 0,
    },
  },
  {
    name: 'Filing Cabinet',
    category: ModuleCategory.OFFICE,
    description: 'Mobile filing cabinet with lock',
    thumbnailUrl: '/assets/modules/filing-cabinet.png',
    defaultDimensions: { width: 420, height: 650, depth: 560 },
    constraints: {
      minWidth: 350,
      maxWidth: 500,
      minHeight: 500,
      maxHeight: 800,
      minDepth: 400,
      maxDepth: 650,
    },
    parameters: {
      drawerCount: 3,
      hasLock: true,
      onCasters: true,
    },
    placementRules: {
      allowedSurfaces: ['floor'],
      minHeightFromFloor: 0,
      maxHeightFromFloor: 0,
    },
  },
];

async function seedModuleTemplates() {
  console.log('🌱 Seeding LiDAR module templates...');

  for (const template of moduleTemplates) {
    await prisma.lidarModuleTemplate.upsert({
      where: { 
        // Create a unique identifier based on name and category
        id: `${template.category.toLowerCase()}_${template.name.toLowerCase().replace(/\s+/g, '_')}` 
      },
      update: {
        ...template,
        defaultDimensions: template.defaultDimensions as any,
        constraints: template.constraints as any,
        parameters: template.parameters as any,
        placementRules: template.placementRules as any,
      },
      create: {
        id: `${template.category.toLowerCase()}_${template.name.toLowerCase().replace(/\s+/g, '_')}`,
        ...template,
        defaultDimensions: template.defaultDimensions as any,
        constraints: template.constraints as any,
        parameters: template.parameters as any,
        placementRules: template.placementRules as any,
        isActive: true,
      },
    });

    console.log(`  ✓ ${template.name} (${template.category})`);
  }

  console.log(`\n✅ Seeded ${moduleTemplates.length} module templates`);
}

async function main() {
  try {
    await seedModuleTemplates();
  } catch (error) {
    console.error('❌ Error seeding module templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

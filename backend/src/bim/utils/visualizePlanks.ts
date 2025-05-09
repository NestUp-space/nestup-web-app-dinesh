import { Plank } from '../types/bim.types';

// Constants for visualization
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDING = 50;
const COLORS = {
  background: '#f5f5f5',
  plank: '#d4a373',
  plankStroke: '#8b5e34',
  text: '#333333',
  dimension: '#666666',
  grid: '#dddddd',
};

/**
 * @description Calculates the layout (position and scaled dimensions) for each plank
 * @param planks The list of planks
 * @param scale The scale factor (mm to pixels)
 * @returns The planks with layout information
 */
function calculatePlankLayout(planks: Plank[], scale: number, canvasWidth: number) {
  // For a simple visualization, arrange planks in a grid
  const planksWithLayout = planks.map((plank, index) => {
    // Skip planks with null dimensions
    if (plank.width === null || plank.height === null) {
      console.warn(`Plank ${plank.plankId} has null dimensions, using defaults`);
    }

    const width = plank.width || 100; // Default width if null
    const height = plank.height || 100; // Default height if null

    // Scale dimensions
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    // Calculate position (simple grid layout)
    const cols = Math.max(1, Math.floor((canvasWidth - 2 * PADDING) / (scaledWidth + PADDING))); // Ensure at least 1 column
    const row = Math.floor(index / cols);
    const col = index % cols;

    const x = PADDING + col * (scaledWidth + PADDING);
    const y = PADDING + row * (scaledHeight + PADDING);

    return {
      ...plank,
      x,
      y,
      scaledWidth,
      scaledHeight,
    };
  });

  return planksWithLayout;
}


/**
 * @description Generates an SVG string representation of the planks
 * @param planks The list of planks to visualize
 * @param options Visualization options
 * @returns An SVG string
 */
export function generatePlanksSvg(
  planks: Plank[],
  options: {
    title?: string;
    showDimensions?: boolean;
    showLabels?: boolean;
    scale?: number;
    width?: number;
    height?: number;
  } = {}
): string {
  const {
    title = 'Plank Visualization',
    showDimensions = true,
    showLabels = true,
    scale = 0.1,
    width = CANVAS_WIDTH,
    height = CANVAS_HEIGHT,
  } = options;

  // Calculate the maximum dimensions to determine the scale
  const maxWidth = Math.max(0, ...planks.map(p => p.width || 0)); // Ensure non-negative max
  const maxHeight = Math.max(0, ...planks.map(p => p.height || 0)); // Ensure non-negative max

  // Adjust scale if necessary to fit within canvas
  const maxDimension = Math.max(maxWidth, maxHeight);
  const availableSpace = Math.min(width, height) - 2 * PADDING;
  
  // Avoid division by zero or negative scale if maxDimension is 0
  const autoScale = (maxDimension > 0 && availableSpace > 0) ? availableSpace / maxDimension : scale;

  // Use the smaller of the provided scale or auto-calculated scale, ensure positive
  const effectiveScale = Math.max(0.001, Math.min(scale, autoScale)); // Ensure scale is positive

  // Calculate the layout (position) for each plank
  const planksWithLayout = calculatePlankLayout(planks, effectiveScale, width);

  // Generate SVG content
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif">`; // Added font-family
  svg += `<rect width="${width}" height="${height}" fill="${COLORS.background}" />`;

  // Draw grid
  for (let x = PADDING; x < width - PADDING; x += 50) {
    svg += `<line x1="${x}" y1="${PADDING}" x2="${x}" y2="${height - PADDING}" stroke="${COLORS.grid}" stroke-width="1" />`;
  }

  for (let y = PADDING; y < height - PADDING; y += 50) {
    svg += `<line x1="${PADDING}" y1="${y}" x2="${width - PADDING}" y2="${y}" stroke="${COLORS.grid}" stroke-width="1" />`;
  }

  // Draw planks
  planksWithLayout.forEach(plank => {
    // Plank rectangle
    svg += `<rect x="${plank.x}" y="${plank.y}" width="${plank.scaledWidth}" height="${plank.scaledHeight}" fill="${COLORS.plank}" stroke="${COLORS.plankStroke}" stroke-width="1" />`;

    // Plank label
    if (showLabels && plank.name) { // Check if name exists
      svg += `<text x="${plank.x + plank.scaledWidth / 2}" y="${plank.y + plank.scaledHeight / 2}" text-anchor="middle" dominant-baseline="middle" fill="${COLORS.text}" font-size="12">${plank.name}</text>`;
    }

    // Dimensions
    if (showDimensions && plank.width != null && plank.height != null) { // Check if dimensions exist
      // Width dimension
      svg += `<line x1="${plank.x}" y1="${plank.y + plank.scaledHeight + 10}" x2="${plank.x + plank.scaledWidth}" y2="${plank.y + plank.scaledHeight + 10}" stroke="${COLORS.dimension}" stroke-width="1" />`;
      svg += `<text x="${plank.x + plank.scaledWidth / 2}" y="${plank.y + plank.scaledHeight + 25}" text-anchor="middle" fill="${COLORS.dimension}" font-size="10">${plank.width}mm</text>`;

      // Height dimension
      svg += `<line x1="${plank.x + plank.scaledWidth + 10}" y1="${plank.y}" x2="${plank.x + plank.scaledWidth + 10}" y2="${plank.y + plank.scaledHeight}" stroke="${COLORS.dimension}" stroke-width="1" />`;
      svg += `<text x="${plank.x + plank.scaledWidth + 25}" y="${plank.y + plank.scaledHeight / 2}" text-anchor="middle" dominant-baseline="middle" fill="${COLORS.dimension}" font-size="10" transform="rotate(90, ${plank.x + plank.scaledWidth + 25}, ${plank.y + plank.scaledHeight / 2})">${plank.height}mm</text>`;
    }
  });

  // Scale indicator
  svg += `<line x1="${PADDING}" y1="${height - PADDING / 2}" x2="${PADDING + 100 * effectiveScale}" y2="${height - PADDING / 2}" stroke="${COLORS.dimension}" stroke-width="2" />`;
  svg += `<text x="${PADDING + 50 * effectiveScale}" y="${height - PADDING / 4}" text-anchor="middle" fill="${COLORS.dimension}" font-size="10">100mm</text>`;

  // Title
  svg += `<text x="${width / 2}" y="${PADDING / 2}" text-anchor="middle" fill="${COLORS.text}" font-size="16">${title}</text>`;

  svg += '</svg>';

  return svg;
}

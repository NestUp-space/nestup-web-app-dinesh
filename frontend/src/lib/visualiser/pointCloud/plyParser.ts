/**
 * PLY Parser
 * Parses PLY (Polygon File Format) point cloud files
 * Supports ASCII and binary (little-endian) formats
 */

import type { PointCloudData, BoundingBox } from "@/types/visualiser";

// ============================================
// Types
// ============================================

interface PLYHeader {
  format: 'ascii' | 'binary_little_endian' | 'binary_big_endian';
  vertexCount: number;
  properties: PLYProperty[];
  headerEndOffset: number;
}

interface PLYProperty {
  name: string;
  type: string;
  index: number;
}

interface ParseResult {
  success: boolean;
  data?: PointCloudData;
  error?: string;
}

// ============================================
// Header Parsing
// ============================================

function parseHeader(text: string): PLYHeader | null {
  const lines = text.split('\n');
  let format: PLYHeader['format'] = 'ascii';
  let vertexCount = 0;
  const properties: PLYProperty[] = [];
  let propertyIndex = 0;
  let headerEndOffset = 0;
  let inVertex = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    headerEndOffset += lines[i].length + 1; // +1 for newline
    
    if (line === 'end_header') {
      break;
    }
    
    if (line.startsWith('format')) {
      const parts = line.split(/\s+/);
      if (parts[1] === 'binary_little_endian') {
        format = 'binary_little_endian';
      } else if (parts[1] === 'binary_big_endian') {
        format = 'binary_big_endian';
      }
    }
    
    if (line.startsWith('element vertex')) {
      const parts = line.split(/\s+/);
      vertexCount = parseInt(parts[2], 10);
      inVertex = true;
    }
    
    if (line.startsWith('element ') && !line.startsWith('element vertex')) {
      inVertex = false;
    }
    
    if (inVertex && line.startsWith('property')) {
      const parts = line.split(/\s+/);
      const type = parts[1];
      const name = parts[2];
      properties.push({ name, type, index: propertyIndex++ });
    }
  }
  
  if (vertexCount === 0) {
    return null;
  }
  
  return { format, vertexCount, properties, headerEndOffset };
}

// ============================================
// Type Size Helpers
// ============================================

function getTypeSize(type: string): number {
  switch (type) {
    case 'float':
    case 'float32':
    case 'int':
    case 'int32':
    case 'uint':
    case 'uint32':
      return 4;
    case 'double':
    case 'float64':
      return 8;
    case 'short':
    case 'int16':
    case 'uint16':
    case 'ushort':
      return 2;
    case 'char':
    case 'int8':
    case 'uchar':
    case 'uint8':
      return 1;
    default:
      return 4;
  }
}

function getPropertyReader(type: string, littleEndian: boolean): (view: DataView, offset: number) => number {
  switch (type) {
    case 'float':
    case 'float32':
      return (view, offset) => view.getFloat32(offset, littleEndian);
    case 'double':
    case 'float64':
      return (view, offset) => view.getFloat64(offset, littleEndian);
    case 'int':
    case 'int32':
      return (view, offset) => view.getInt32(offset, littleEndian);
    case 'uint':
    case 'uint32':
      return (view, offset) => view.getUint32(offset, littleEndian);
    case 'short':
    case 'int16':
      return (view, offset) => view.getInt16(offset, littleEndian);
    case 'ushort':
    case 'uint16':
      return (view, offset) => view.getUint16(offset, littleEndian);
    case 'char':
    case 'int8':
      return (view, offset) => view.getInt8(offset);
    case 'uchar':
    case 'uint8':
      return (view, offset) => view.getUint8(offset);
    default:
      return (view, offset) => view.getFloat32(offset, littleEndian);
  }
}

// ============================================
// Binary Parsing
// ============================================

function parseBinary(
  buffer: ArrayBuffer,
  header: PLYHeader
): PointCloudData | null {
  const littleEndian = header.format === 'binary_little_endian';
  const view = new DataView(buffer, header.headerEndOffset);
  
  // Find property indices
  const xIdx = header.properties.findIndex(p => p.name === 'x');
  const yIdx = header.properties.findIndex(p => p.name === 'y');
  const zIdx = header.properties.findIndex(p => p.name === 'z');
  const rIdx = header.properties.findIndex(p => p.name === 'red' || p.name === 'r');
  const gIdx = header.properties.findIndex(p => p.name === 'green' || p.name === 'g');
  const bIdx = header.properties.findIndex(p => p.name === 'blue' || p.name === 'b');
  
  if (xIdx === -1 || yIdx === -1 || zIdx === -1) {
    return null;
  }
  
  // Calculate vertex stride
  let vertexStride = 0;
  const propertyReaders: { offset: number; reader: (view: DataView, offset: number) => number }[] = [];
  
  for (const prop of header.properties) {
    const size = getTypeSize(prop.type);
    propertyReaders.push({
      offset: vertexStride,
      reader: getPropertyReader(prop.type, littleEndian),
    });
    vertexStride += size;
  }
  
  // Allocate arrays
  const positions = new Float32Array(header.vertexCount * 3);
  const hasColors = rIdx !== -1 && gIdx !== -1 && bIdx !== -1;
  const colors = hasColors ? new Float32Array(header.vertexCount * 3) : undefined;
  
  // Bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  
  // Read vertices
  for (let i = 0; i < header.vertexCount; i++) {
    const baseOffset = i * vertexStride;
    
    const x = propertyReaders[xIdx].reader(view, baseOffset + propertyReaders[xIdx].offset);
    const y = propertyReaders[yIdx].reader(view, baseOffset + propertyReaders[yIdx].offset);
    const z = propertyReaders[zIdx].reader(view, baseOffset + propertyReaders[zIdx].offset);
    
    // Convert to mm if values seem to be in meters
    const scale = Math.abs(x) < 100 && Math.abs(y) < 100 && Math.abs(z) < 100 ? 1000 : 1;
    
    positions[i * 3] = x * scale;
    positions[i * 3 + 1] = y * scale;
    positions[i * 3 + 2] = z * scale;
    
    // Update bounds
    minX = Math.min(minX, positions[i * 3]);
    minY = Math.min(minY, positions[i * 3 + 1]);
    minZ = Math.min(minZ, positions[i * 3 + 2]);
    maxX = Math.max(maxX, positions[i * 3]);
    maxY = Math.max(maxY, positions[i * 3 + 1]);
    maxZ = Math.max(maxZ, positions[i * 3 + 2]);
    
    // Read colors
    if (hasColors && colors) {
      const r = propertyReaders[rIdx].reader(view, baseOffset + propertyReaders[rIdx].offset);
      const g = propertyReaders[gIdx].reader(view, baseOffset + propertyReaders[gIdx].offset);
      const b = propertyReaders[bIdx].reader(view, baseOffset + propertyReaders[bIdx].offset);
      
      // Normalize to 0-1 range
      const normalize = r > 1 || g > 1 || b > 1 ? 1/255 : 1;
      colors[i * 3] = r * normalize;
      colors[i * 3 + 1] = g * normalize;
      colors[i * 3 + 2] = b * normalize;
    }
  }
  
  return {
    positions,
    colors,
    pointCount: header.vertexCount,
    bounds: { minX, maxX, minY, maxY, minZ, maxZ },
  };
}

// ============================================
// ASCII Parsing
// ============================================

function parseASCII(
  text: string,
  header: PLYHeader
): PointCloudData | null {
  // Find the end_header line
  const headerEndIndex = text.indexOf('end_header');
  if (headerEndIndex === -1) return null;
  
  const dataStart = text.indexOf('\n', headerEndIndex) + 1;
  const dataText = text.slice(dataStart);
  const lines = dataText.trim().split('\n');
  
  // Find property indices
  const xIdx = header.properties.findIndex(p => p.name === 'x');
  const yIdx = header.properties.findIndex(p => p.name === 'y');
  const zIdx = header.properties.findIndex(p => p.name === 'z');
  const rIdx = header.properties.findIndex(p => p.name === 'red' || p.name === 'r');
  const gIdx = header.properties.findIndex(p => p.name === 'green' || p.name === 'g');
  const bIdx = header.properties.findIndex(p => p.name === 'blue' || p.name === 'b');
  
  if (xIdx === -1 || yIdx === -1 || zIdx === -1) {
    return null;
  }
  
  const actualCount = Math.min(lines.length, header.vertexCount);
  const positions = new Float32Array(actualCount * 3);
  const hasColors = rIdx !== -1 && gIdx !== -1 && bIdx !== -1;
  const colors = hasColors ? new Float32Array(actualCount * 3) : undefined;
  
  // Bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  
  let validCount = 0;
  
  for (let i = 0; i < actualCount; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length < header.properties.length) continue;
    
    const x = parseFloat(parts[xIdx]);
    const y = parseFloat(parts[yIdx]);
    const z = parseFloat(parts[zIdx]);
    
    if (isNaN(x) || isNaN(y) || isNaN(z)) continue;
    
    // Convert to mm if values seem to be in meters
    const scale = Math.abs(x) < 100 && Math.abs(y) < 100 && Math.abs(z) < 100 ? 1000 : 1;
    
    positions[validCount * 3] = x * scale;
    positions[validCount * 3 + 1] = y * scale;
    positions[validCount * 3 + 2] = z * scale;
    
    // Update bounds
    minX = Math.min(minX, positions[validCount * 3]);
    minY = Math.min(minY, positions[validCount * 3 + 1]);
    minZ = Math.min(minZ, positions[validCount * 3 + 2]);
    maxX = Math.max(maxX, positions[validCount * 3]);
    maxY = Math.max(maxY, positions[validCount * 3 + 1]);
    maxZ = Math.max(maxZ, positions[validCount * 3 + 2]);
    
    // Read colors
    if (hasColors && colors) {
      const r = parseFloat(parts[rIdx]);
      const g = parseFloat(parts[gIdx]);
      const b = parseFloat(parts[bIdx]);
      
      // Normalize to 0-1 range
      const normalize = r > 1 || g > 1 || b > 1 ? 1/255 : 1;
      colors[validCount * 3] = r * normalize;
      colors[validCount * 3 + 1] = g * normalize;
      colors[validCount * 3 + 2] = b * normalize;
    }
    
    validCount++;
  }
  
  // Trim arrays to actual size
  return {
    positions: positions.slice(0, validCount * 3),
    colors: colors?.slice(0, validCount * 3),
    pointCount: validCount,
    bounds: { minX, maxX, minY, maxY, minZ, maxZ },
  };
}

// ============================================
// Main Parse Function
// ============================================

/**
 * Parses a PLY file and returns point cloud data
 */
export async function parsePLY(file: File): Promise<ParseResult> {
  try {
    // Read file as array buffer
    const buffer = await file.arrayBuffer();
    
    // Decode header as text (headers are always ASCII)
    const headerBytes = new Uint8Array(buffer.slice(0, Math.min(10000, buffer.byteLength)));
    const decoder = new TextDecoder('utf-8');
    const headerText = decoder.decode(headerBytes);
    
    // Parse header
    const header = parseHeader(headerText);
    if (!header) {
      return { success: false, error: 'Invalid PLY header' };
    }
    
    // Parse based on format
    let data: PointCloudData | null;
    
    if (header.format === 'ascii') {
      const text = decoder.decode(new Uint8Array(buffer));
      data = parseASCII(text, header);
    } else {
      data = parseBinary(buffer, header);
    }
    
    if (!data) {
      return { success: false, error: 'Failed to parse point cloud data' };
    }
    
    return { success: true, data };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Downsamples a point cloud using voxel grid filter
 */
export function downsamplePointCloud(
  data: PointCloudData,
  voxelSize: number
): PointCloudData {
  const { positions, colors, bounds } = data;
  
  // Create voxel grid
  const voxelMap = new Map<string, { pos: number[]; color?: number[]; count: number }>();
  
  for (let i = 0; i < data.pointCount; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    
    // Calculate voxel key
    const vx = Math.floor(x / voxelSize);
    const vy = Math.floor(y / voxelSize);
    const vz = Math.floor(z / voxelSize);
    const key = `${vx},${vy},${vz}`;
    
    const existing = voxelMap.get(key);
    if (existing) {
      // Average position
      existing.pos[0] += x;
      existing.pos[1] += y;
      existing.pos[2] += z;
      // Average color
      if (colors && existing.color) {
        existing.color[0] += colors[i * 3];
        existing.color[1] += colors[i * 3 + 1];
        existing.color[2] += colors[i * 3 + 2];
      }
      existing.count++;
    } else {
      voxelMap.set(key, {
        pos: [x, y, z],
        color: colors ? [colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]] : undefined,
        count: 1,
      });
    }
  }
  
  // Create output arrays
  const newCount = voxelMap.size;
  const newPositions = new Float32Array(newCount * 3);
  const newColors = colors ? new Float32Array(newCount * 3) : undefined;
  
  let idx = 0;
  voxelMap.forEach((voxel) => {
    newPositions[idx * 3] = voxel.pos[0] / voxel.count;
    newPositions[idx * 3 + 1] = voxel.pos[1] / voxel.count;
    newPositions[idx * 3 + 2] = voxel.pos[2] / voxel.count;
    
    if (newColors && voxel.color) {
      newColors[idx * 3] = voxel.color[0] / voxel.count;
      newColors[idx * 3 + 1] = voxel.color[1] / voxel.count;
      newColors[idx * 3 + 2] = voxel.color[2] / voxel.count;
    }
    
    idx++;
  });
  
  return {
    positions: newPositions,
    colors: newColors,
    pointCount: newCount,
    bounds,
  };
}

export default {
  parsePLY,
  downsamplePointCloud,
};

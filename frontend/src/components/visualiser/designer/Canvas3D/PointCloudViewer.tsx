/**
 * PointCloudViewer Component
 * Renders a point cloud in the 3D scene
 */

"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import type { PointCloudData } from "@/types/visualiser";

interface PointCloudViewerProps {
  data: PointCloudData;
  visible?: boolean;
  pointSize?: number;
  opacity?: number;
}

export function PointCloudViewer({
  data,
  visible = true,
  pointSize = 2,
  opacity = 0.8,
}: PointCloudViewerProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    // Convert positions: Data coords to Three.js coords
    // Data: X=Width, Y=Depth, Z=Height
    // Three.js: X=Width, Y=Height, Z=-Depth
    const convertedPositions = new Float32Array(data.positions.length);
    
    for (let i = 0; i < data.pointCount; i++) {
      convertedPositions[i * 3] = data.positions[i * 3];       // X stays same
      convertedPositions[i * 3 + 1] = data.positions[i * 3 + 2]; // Z becomes Y
      convertedPositions[i * 3 + 2] = -data.positions[i * 3 + 1]; // -Y becomes Z
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(convertedPositions, 3));
    
    // Add colors if available
    if (data.colors) {
      geo.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    }
    
    geo.computeBoundingSphere();
    
    return geo;
  }, [data]);

  // Create material
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: !!data.colors,
      color: data.colors ? undefined : '#4299E1',
      transparent: opacity < 1,
      opacity,
      sizeAttenuation: true,
    });
  }, [data.colors, pointSize, opacity]);

  if (!visible) return null;

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
}

export default PointCloudViewer;

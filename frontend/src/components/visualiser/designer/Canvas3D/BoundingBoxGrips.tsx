'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Position, Box } from '@/types/visualiser';
import { getBoxCorners, getBoxEdgeMidpoints } from '@/lib/visualiser/snapSystem';

const GRIP_COLORS = {
  normal: '#808080',   // Gray
  obscured: '#0066FF', // Blue (behind object per spec Section 4)
  hover: '#0066FF',    // Blue
};

const GRIP_SIZE = 6;

type GripMode = 'corners' | 'edgeMidpoints' | 'faceCenters' | 'objectCenter';
const GRIP_CYCLE_ORDER: GripMode[] = ['corners', 'edgeMidpoints', 'faceCenters', 'objectCenter'];

function dataToThree(x: number, y: number, z: number): [number, number, number] {
  return [x, z, y];
}

interface BoundingBoxGripsProps {
  box: Box;
  visible: boolean;
}

function getBoxFaceCenters(pos: Position, w: number, d: number, h: number): Position[] {
  return [
    { x: pos.x + w / 2, y: pos.y, z: pos.z + h / 2 },        // Front
    { x: pos.x + w / 2, y: pos.y + d, z: pos.z + h / 2 },     // Back
    { x: pos.x, y: pos.y + d / 2, z: pos.z + h / 2 },          // Left
    { x: pos.x + w, y: pos.y + d / 2, z: pos.z + h / 2 },      // Right
    { x: pos.x + w / 2, y: pos.y + d / 2, z: pos.z },           // Bottom
    { x: pos.x + w / 2, y: pos.y + d / 2, z: pos.z + h },      // Top
  ];
}

function getObjectCenter(pos: Position, w: number, d: number, h: number): Position {
  return {
    x: pos.x + w / 2,
    y: pos.y + d / 2,
    z: pos.z + h / 2,
  };
}

/**
 * Test whether a grip point is occluded by the box mesh.
 * Projects both the grip and box center, then checks if the grip is farther
 * from the camera than the box center along the view direction.
 */
function isGripObscured(
  gripDataPos: Position,
  boxCenter: THREE.Vector3,
  camera: THREE.Camera,
): boolean {
  const gripWorld = new THREE.Vector3(...dataToThree(gripDataPos.x, gripDataPos.y, gripDataPos.z));
  const camPos = camera.position;
  const distGrip = gripWorld.distanceTo(camPos);
  const distCenter = boxCenter.distanceTo(camPos);
  return distGrip > distCenter + 1; // +1mm tolerance
}

export const BoundingBoxGrips: React.FC<BoundingBoxGripsProps> = ({ box, visible }) => {
  const { camera } = useThree();
  const [gripMode, setGripMode] = useState<GripMode>('corners');

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && !e.repeat) {
        e.preventDefault();
        setGripMode(prev => {
          const idx = GRIP_CYCLE_ORDER.indexOf(prev);
          return GRIP_CYCLE_ORDER[(idx + 1) % GRIP_CYCLE_ORDER.length];
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  const { lenX: w, lenY: d, lenZ: h } = box.dimensions;
  const pos = box.position;

  const boxCenter = useMemo(() => {
    return new THREE.Vector3(...dataToThree(pos.x + w / 2, pos.y + d / 2, pos.z + h / 2));
  }, [pos, w, d, h]);

  const gripPositions = useMemo((): Position[] => {
    switch (gripMode) {
      case 'corners':
        return getBoxCorners(pos, w, d, h);
      case 'edgeMidpoints':
        return getBoxEdgeMidpoints(pos, w, d, h);
      case 'faceCenters':
        return getBoxFaceCenters(pos, w, d, h);
      case 'objectCenter':
        return [getObjectCenter(pos, w, d, h)];
    }
  }, [gripMode, pos, w, d, h]);

  const hasObscured = useMemo(() => {
    return gripPositions.some(p => isGripObscured(p, boxCenter, camera));
  }, [gripPositions, boxCenter, camera]);

  if (!visible) return null;

  return (
    <group>
      {gripPositions.map((p, i) => {
        const [x, y, z] = dataToThree(p.x, p.y, p.z);
        const obscured = isGripObscured(p, boxCenter, camera);
        return (
          <Html key={`${gripMode}-${i}`} position={[x, y, z]} center style={{ pointerEvents: 'none' }}>
            <div
              style={{
                width: GRIP_SIZE * 2,
                height: GRIP_SIZE * 2,
                borderRadius: '50%',
                backgroundColor: obscured ? GRIP_COLORS.obscured : GRIP_COLORS.normal,
                border: '1px solid white',
                opacity: obscured ? 0.7 : 1,
              }}
            />
          </Html>
        );
      })}
      {/* When any grip is obscured, make the box semi-transparent so grips are visible */}
      {hasObscured && (
        <mesh position={boxCenter}>
          <boxGeometry args={[w, h, d]} />
          <meshBasicMaterial transparent opacity={0.15} color={0x888888} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};

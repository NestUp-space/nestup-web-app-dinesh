import type { MeasurementResult } from './measurementApi';

export type WallDirection = 'East' | 'West' | 'North' | 'South';

export interface WallContext {
  roomName: string;
  direction: WallDirection;
}

export interface RoomPresetAndWall {
  presetId: string;
  presetLabel: string;
  wallId: string;
  wallLabel: string;
}

export interface DesignPayload {
  measurement: MeasurementResult;
  wallContext?: WallContext;
  roomPreset?: RoomPresetAndWall;
}

export const ROOM_PRESETS = [
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'living', label: 'Living Room' },
  { id: 'office', label: 'Office' },
] as const;

export const WALL_OPTIONS = [
  { id: 'E1', label: 'Wall E1' },
  { id: 'E2', label: 'Wall E2' },
  { id: 'E3', label: 'Wall E3' },
  { id: 'E4', label: 'Wall E4' },
] as const;

export const DIRECTION_OPTIONS: { value: WallDirection; label: string }[] = [
  { value: 'East', label: 'East' },
  { value: 'West', label: 'West' },
  { value: 'North', label: 'North' },
  { value: 'South', label: 'South' },
];

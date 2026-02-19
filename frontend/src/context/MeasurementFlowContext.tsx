'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { MeasurementResult } from '@/lib/measurements/measurementApi';
import type { RoomPresetAndWall, WallContext } from '@/lib/measurements/designTypes';

export interface MeasurementFlowState {
  roomPreset: RoomPresetAndWall | undefined;
  wallContext: WallContext | undefined;
  imageFile: File | undefined;
  imageUrl: string | undefined;
  result: MeasurementResult | undefined;
}

interface MeasurementFlowContextValue extends MeasurementFlowState {
  setRoomPreset: (v: RoomPresetAndWall | undefined) => void;
  setWallContext: (v: WallContext | undefined) => void;
  setImageFile: (file: File | undefined, blobUrl?: string) => void;
  setResult: (v: MeasurementResult | undefined) => void;
  setImageUrl: (v: string | undefined) => void;
  clearFlow: () => void;
}

const initialState: MeasurementFlowState = {
  roomPreset: undefined,
  wallContext: undefined,
  imageFile: undefined,
  imageUrl: undefined,
  result: undefined,
};

const MeasurementFlowContext = createContext<MeasurementFlowContextValue | null>(null);

export function MeasurementFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MeasurementFlowState>(initialState);

  const setRoomPreset = useCallback((roomPreset: RoomPresetAndWall | undefined) => {
    setState((s) => ({ ...s, roomPreset }));
  }, []);

  const setWallContext = useCallback((wallContext: WallContext | undefined) => {
    setState((s) => ({ ...s, wallContext }));
  }, []);

  const setImageFile = useCallback((file: File | undefined, blobUrl?: string) => {
    setState((s) => {
      if (s.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(s.imageUrl);
      const url = blobUrl ?? (file ? URL.createObjectURL(file) : undefined);
      return { ...s, imageFile: file, imageUrl: url };
    });
  }, []);

  const setImageUrl = useCallback((imageUrl: string | undefined) => {
    setState((s) => ({ ...s, imageUrl }));
  }, []);

  const setResult = useCallback((result: MeasurementResult | undefined) => {
    setState((s) => ({ ...s, result }));
  }, []);

  const clearFlow = useCallback(() => {
    setState((s) => {
      if (s.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(s.imageUrl);
      return initialState;
    });
  }, []);

  const value = useMemo<MeasurementFlowContextValue>(
    () => ({
      ...state,
      setRoomPreset,
      setWallContext,
      setImageFile,
      setImageUrl,
      setResult,
      clearFlow,
    }),
    [state, setRoomPreset, setWallContext, setImageFile, setImageUrl, setResult, clearFlow]
  );

  return (
    <MeasurementFlowContext.Provider value={value}>
      {children}
    </MeasurementFlowContext.Provider>
  );
}

export function useMeasurementFlow(): MeasurementFlowContextValue {
  const ctx = useContext(MeasurementFlowContext);
  if (!ctx) {
    throw new Error('useMeasurementFlow must be used within MeasurementFlowProvider');
  }
  return ctx;
}

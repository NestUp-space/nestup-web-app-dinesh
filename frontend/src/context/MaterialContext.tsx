"use client";

import React, { createContext, useContext } from 'react';
import { Material } from '@/hooks/useMaterial';

interface MaterialContextType {
  materials: Material[];
  loading: boolean;
  error: any;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

interface MaterialProviderProps {
  projectId: string | number;
  children: React.ReactNode;
}

export const MaterialProvider: React.FC<MaterialProviderProps> = ({ projectId, children }) => {
  // const { materials, loading, error } = useProjectMaterials(projectId);

  // const value: MaterialContextType = {
  //   materials,
  //   loading,
  //   error,
  // };

  // return (
  //   <MaterialContext.Provider value={value}>
  //     {children}
  //   </MaterialContext.Provider>
  // );
  return (<MaterialContext.Provider value={{materials:[], loading:false, error:null}}>{children}</MaterialContext.Provider>);
};

export const useMaterialContext = () => {
  const context = useContext(MaterialContext);
  if (!context) {
    throw new Error('useMaterialContext must be used within a MaterialProvider');
  }
  return context;
};

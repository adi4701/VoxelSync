'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { init as coreInit } from '@cornerstonejs/core';
import { init as toolsInit, addTool, ZoomTool, PanTool, WindowLevelTool, StackScrollTool } from '@cornerstonejs/tools';
import { registerVoxelSyncImageLoader } from '@/lib/voxelsync-image-loader';

interface CornerstoneContextType {
  isInitialized: boolean;
  error: Error | null;
}

const CornerstoneContext = createContext<CornerstoneContextType>({
  isInitialized: false,
  error: null,
});

export function useCornerstone() {
  return useContext(CornerstoneContext);
}

export function CornerstoneInit({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await coreInit();
        await toolsInit();

        addTool(ZoomTool);
        addTool(PanTool);
        addTool(WindowLevelTool);
        addTool(StackScrollTool);

        registerVoxelSyncImageLoader();

        if (mounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize Cornerstone'));
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <CornerstoneContext.Provider value={{ isInitialized, error }}>
      {children}
    </CornerstoneContext.Provider>
  );
}

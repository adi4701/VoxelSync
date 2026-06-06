'use client';

import { useEffect, useRef } from 'react';
import { RenderingEngine, getRenderingEngine, Enums, type StackViewport } from '@cornerstonejs/core';
import { ToolGroupManager, Enums as csToolsEnums } from '@cornerstonejs/tools';
import { useCornerstone } from './CornerstoneInit';
import { useViewportSync } from '@/hooks/useViewportSync';
import { extractViewportState, applyViewportState } from '@/lib/viewport-state';
import { useLocalParticipant } from '@livekit/components-react';
import { StudyLoadCommand, ViewportSyncPayload } from '@voxelsync/types';

export function DicomViewport({
  studyUrl,
  activeTool = 'WindowLevel',
  isSyncing = true,
}: {
  studyUrl: string | null;
  activeTool?: string;
  isSyncing?: boolean;
}) {
  const { isInitialized } = useCornerstone();
  const elementRef = useRef<HTMLDivElement>(null);
  const viewportId = 'CT_AXIAL';
  const renderingEngineId = 'myRenderingEngine';
  const toolGroupId = 'myToolGroup';

  const { localParticipant } = useLocalParticipant();

  const handleIncomingSync = (payload: ViewportSyncPayload) => {
    if (!isSyncing) return;
    if (payload.senderId === localParticipant?.identity) return; // ignore own updates
    
    try {
      // getRenderingEngine is a function — looks up the existing engine, never creates a new one
      const engine = getRenderingEngine(renderingEngineId);
      if (!engine) return;
      const viewport = engine.getViewport(viewportId) as StackViewport;
      if (viewport) {
        applyViewportState(viewport, payload);
      }
    } catch {
      // Viewport or engine might be disposed during unmount
    }
  };

  const handleStudyLoad = (cmd: StudyLoadCommand) => {
    // In a full app, this would update a global state to fetch the study.
    // For now, we can just log it since the parent component manages `studyUrl`.
    console.log('Peer loaded study:', cmd.studyId);
  };

  const { sendViewportState } = useViewportSync(handleIncomingSync, handleStudyLoad);

  useEffect(() => {
    const el = elementRef.current;
    if (!isInitialized || !el || !studyUrl) return;

    const renderingEngine = new RenderingEngine(renderingEngineId);

    const viewportInput = {
      viewportId,
      type: Enums.ViewportType.STACK,
      element: el,
    };

    renderingEngine.enableElement(viewportInput);
    const viewport = renderingEngine.getViewport(viewportId) as StackViewport;

    // Load Image
    const loadAndRender = async () => {
      try {
        await viewport.setStack([studyUrl]);
        viewport.render();
      } catch (err) {
        console.error('Failed to load image stack', err);
      }
    };
    loadAndRender();

    // Setup Tools
    let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup) {
      toolGroup = ToolGroupManager.createToolGroup(toolGroupId)!;
      toolGroup.addTool('Zoom');
      toolGroup.addTool('Pan');
      toolGroup.addTool('WindowLevel');
      toolGroup.addTool('StackScroll');
    }
    toolGroup.addViewport(viewportId, renderingEngineId);
    toolGroup.setToolActive('Zoom', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }] });
    toolGroup.setToolActive('Pan', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }] });
    toolGroup.setToolActive('StackScroll', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Wheel }] });

    // Setup Event Listeners for Sync
    const handleCameraModified = () => {
      if (isSyncing && localParticipant) {
        const state = extractViewportState(viewport, localParticipant.identity);
        sendViewportState(state);
      }
    };

    el.addEventListener(Enums.Events.CAMERA_MODIFIED, handleCameraModified);
    el.addEventListener(Enums.Events.VOI_MODIFIED, handleCameraModified);
    el.addEventListener(Enums.Events.STACK_NEW_IMAGE, handleCameraModified);

    return () => {
      el.removeEventListener(Enums.Events.CAMERA_MODIFIED, handleCameraModified);
      el.removeEventListener(Enums.Events.VOI_MODIFIED, handleCameraModified);
      el.removeEventListener(Enums.Events.STACK_NEW_IMAGE, handleCameraModified);
      toolGroup?.removeViewports(renderingEngineId, viewportId);
      renderingEngine.destroy();
    };
  }, [isInitialized, studyUrl, isSyncing, localParticipant, sendViewportState]);

  // Update active tool dynamically
  useEffect(() => {
    if (!isInitialized) return;
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    if (toolGroup) {
      // Disable others (primary bindings)
      ['Zoom', 'Pan', 'WindowLevel'].forEach(t => {
        if (t !== activeTool) {
          toolGroup.setToolPassive(t);
        }
      });
      toolGroup.setToolActive(activeTool, { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }] });
    }
  }, [activeTool, isInitialized, toolGroupId]);

  if (!studyUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <p className="text-slate-500 font-mono">No Study Loaded</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      <div ref={elementRef} className="absolute inset-0" onContextMenu={e => e.preventDefault()} />
      
      {/* Overlays */}
      <div className="absolute top-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${isSyncing ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {isSyncing ? 'SYNC: ON' : 'SYNC: OFF'}
        </span>
      </div>
    </div>
  );
}

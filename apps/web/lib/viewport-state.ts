import { StackViewport } from '@cornerstonejs/core';
import { ViewportSyncPayload } from '@voxelsync/types';

export function extractViewportState(
  viewport: StackViewport,
  senderId: string
): ViewportSyncPayload {
  const camera = viewport.getCamera();
  const properties = viewport.getProperties();
  const sliceIndex = viewport.getCurrentImageIdIndex();

  return {
    type: 'viewport-sync',
    senderId,
    timestamp: Date.now(),
    camera: {
      focalPoint: camera.focalPoint as [number, number, number],
      position: camera.position as [number, number, number],
      viewUp: camera.viewUp as [number, number, number],
      parallelScale: camera.parallelScale ?? 1,
    },
    voiRange: properties.voiRange || { lower: 0, upper: 255 },
    sliceIndex,
  };
}

export function applyViewportState(
  viewport: StackViewport,
  state: ViewportSyncPayload
) {
  // Update slice if changed
  if (viewport.getCurrentImageIdIndex() !== state.sliceIndex) {
    // Only safe if the stack has that index
    try {
      viewport.setImageIdIndex(state.sliceIndex);
    } catch (err) {
      console.warn('Failed to set slice index', err);
    }
  }

  // Update VOI (Window/Level)
  viewport.setProperties({
    voiRange: state.voiRange,
  });

  // Update Camera (Pan/Zoom)
  viewport.setCamera({
    focalPoint: state.camera.focalPoint,
    position: state.camera.position,
    viewUp: state.camera.viewUp,
    parallelScale: state.camera.parallelScale,
  });

  viewport.render();
}

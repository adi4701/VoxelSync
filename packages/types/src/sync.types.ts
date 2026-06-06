import { DicomMetadata } from './dicom.types';

export interface ViewportSyncPayload {
  type: 'viewport-sync';
  senderId: string;
  timestamp: number;
  camera: {
    focalPoint: [number, number, number];
    position: [number, number, number];
    viewUp: [number, number, number];
    parallelScale: number;
  };
  voiRange: { lower: number; upper: number };
  sliceIndex: number;
}

export interface StudyLoadCommand {
  type: 'study-load';
  studyId: string;
  seriesId: string;
  metadata: DicomMetadata;
  frameCount: number;
}

export type SyncPayload = ViewportSyncPayload | StudyLoadCommand;

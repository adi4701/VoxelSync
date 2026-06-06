import { z } from 'zod';

export const DicomMetadataSchema = z.object({
  patientName: z.string(),
  patientId: z.string(),
  studyDate: z.string(),
  studyDescription: z.string(),
  seriesDescription: z.string(),
  modality: z.string(),
  rows: z.number(),
  columns: z.number(),
  bitsAllocated: z.number(),
  pixelRepresentation: z.number().int().min(0).max(1).default(0),
  numberOfFrames: z.number(),
  windowCenter: z.number(),
  windowWidth: z.number(),
  studyInstanceUid: z.string(),
  seriesInstanceUid: z.string(),
});

export const ViewportSyncPayloadSchema = z.object({
  type: z.literal('viewport-sync'),
  senderId: z.string(),
  timestamp: z.number(),
  camera: z.object({
    focalPoint: z.tuple([z.number(), z.number(), z.number()]),
    position: z.tuple([z.number(), z.number(), z.number()]),
    viewUp: z.tuple([z.number(), z.number(), z.number()]),
    parallelScale: z.number(),
  }),
  voiRange: z.object({
    lower: z.number(),
    upper: z.number(),
  }),
  sliceIndex: z.number(),
});

export const StudyLoadCommandSchema = z.object({
  type: z.literal('study-load'),
  studyId: z.string(),
  seriesId: z.string(),
  metadata: DicomMetadataSchema,
  frameCount: z.number(),
});

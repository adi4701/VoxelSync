export interface DicomMetadata {
  patientName: string;
  patientId: string;
  studyDate: string;
  studyDescription: string;
  seriesDescription: string;
  modality: string;
  rows: number;
  columns: number;
  bitsAllocated: number;
  pixelRepresentation: number; // 0 = unsigned, 1 = signed
  numberOfFrames: number;
  windowCenter: number;
  windowWidth: number;
  studyInstanceUid: string;
  seriesInstanceUid: string;
}

export interface RenderOptions {
  windowCenter?: number;
  windowWidth?: number;
  invert?: boolean;
}

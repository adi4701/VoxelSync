/**
 * DICOM Parse Worker (Node.js worker_threads)
 * Receives a DICOM ArrayBuffer on the main thread message,
 * parses metadata off-main-thread, and posts back results.
 *
 * This offloads heavy parsing from the Express event loop.
 */

import { parentPort, workerData } from 'worker_threads';
import * as dicomParser from 'dicom-parser';

interface WorkerInput {
  buffer: ArrayBuffer;
}

type WorkerOutput =
  | {
      success: true;
      metadata: Record<string, unknown>;
      pixelDataOffset: number;
      pixelDataLength: number;
    }
  | {
      success: false;
      error: string;
    };

function parseDicomInWorker(buffer: ArrayBuffer): WorkerOutput {
  try {
    const byteArray = new Uint8Array(buffer);
    const dataSet = dicomParser.parseDicom(byteArray);

    const pixelDataElement = dataSet.elements.x7fe00010;
    if (!pixelDataElement) {
      return { success: false, error: 'No pixel data found in DICOM file' };
    }

    const metadata = {
      patientName: dataSet.string('x00100010') || 'Unknown',
      patientId: dataSet.string('x00100020') || 'Unknown',
      studyDate: dataSet.string('x00080020') || '',
      studyDescription: dataSet.string('x00081030') || '',
      seriesDescription: dataSet.string('x0008103e') || '',
      modality: dataSet.string('x00080060') || 'OT',
      rows: dataSet.uint16('x00280010') || 0,
      columns: dataSet.uint16('x00280011') || 0,
      bitsAllocated: dataSet.uint16('x00280100') || 16,
      pixelRepresentation: dataSet.uint16('x00280103') || 0,
      numberOfFrames: parseInt(dataSet.string('x00280008') || '1', 10),
      windowCenter: parseFloat(dataSet.string('x00281050') || '0'),
      windowWidth: parseFloat(dataSet.string('x00281051') || '0'),
      studyInstanceUid: dataSet.string('x0020000d') || '',
      seriesInstanceUid: dataSet.string('x0020000e') || '',
    };

    return {
      success: true,
      metadata,
      pixelDataOffset: pixelDataElement.dataOffset,
      pixelDataLength: pixelDataElement.length,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown parse error',
    };
  }
}

// Handle message from main thread
if (parentPort) {
  parentPort.on('message', (data: WorkerInput) => {
    const result = parseDicomInWorker(data.buffer);
    parentPort!.postMessage(result);
  });

  // If workerData was passed at init, process it immediately
  if (workerData?.buffer) {
    const result = parseDicomInWorker(workerData.buffer);
    parentPort.postMessage(result);
  }
}

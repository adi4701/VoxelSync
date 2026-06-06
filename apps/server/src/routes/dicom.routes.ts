import { Router, NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { validate as isUUID } from 'uuid';
import { dicomParserService } from '../services/dicom-parser.service';
import { studyStoreService } from '../services/study-store.service';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    // Only accept DICOM files by mimetype or extension
    const isDicom =
      file.mimetype === 'application/dicom' ||
      file.originalname.toLowerCase().endsWith('.dcm');
    if (!isDicom) {
      cb(new Error('Only DICOM (.dcm) files are accepted'));
    } else {
      cb(null, true);
    }
  },
});

/** Security helper: validate studyId is a real UUID to prevent injection */
function validateStudyId(req: Request, res: Response, next: NextFunction): void {
  const { studyId } = req.params;
  if (!studyId || !isUUID(studyId)) {
    res.status(400).json({ error: 'Invalid studyId format' });
    return;
  }
  next();
}

// POST /api/dicom/upload
router.post('/upload', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { metadata, dataSet } = dicomParserService.extractMetadata(req.file.buffer);

    // We only need the offset and length to avoid keeping multiple copies
    const pixelDataElement = dataSet.elements.x7fe00010;
    if (!pixelDataElement) {
      res.status(400).json({ error: 'No pixel data in DICOM file' });
      return;
    }

    const studyId = studyStoreService.store(
      req.file.buffer,
      metadata,
      pixelDataElement.dataOffset,
      pixelDataElement.length
    );

    res.json({ studyId, metadata });
  } catch (error) {
    next(error);
  }
});

// GET /api/dicom/:studyId/metadata
router.get('/:studyId/metadata', validateStudyId, (req, res) => {
  const study = studyStoreService.get(req.params.studyId);
  if (!study) {
    res.status(404).json({ error: 'Study not found' });
    return;
  }
  res.json(study.metadata);
});

// GET /api/dicom/:studyId/frames/:frameIndex
router.get('/:studyId/frames/:frameIndex', validateStudyId, (req, res) => {
  const study = studyStoreService.get(req.params.studyId);
  if (!study) {
    res.status(404).json({ error: 'Study not found' });
    return;
  }

  // Validate frameIndex is a non-negative integer within bounds
  const frameIndex = parseInt(req.params.frameIndex, 10);
  if (isNaN(frameIndex) || frameIndex < 0 || frameIndex >= study.metadata.numberOfFrames) {
    res.status(400).json({
      error: `Invalid frameIndex. Must be 0–${study.metadata.numberOfFrames - 1}`,
    });
    return;
  }

  // Calculate per-frame byte offset for multi-frame DICOMs
  const bitsAllocated = study.metadata.bitsAllocated;
  const bytesPerPixel = bitsAllocated / 8;
  const frameSize = study.metadata.rows * study.metadata.columns * bytesPerPixel;
  const frameOffset = study.pixelDataOffset + frameIndex * frameSize;
  const frameEnd = frameOffset + frameSize;

  // Bounds-check against the actual buffer length
  if (frameEnd > study.buffer.length) {
    res.status(400).json({ error: 'Frame data out of buffer bounds' });
    return;
  }

  // Set DICOM-specific headers so the browser client can reconstruct the image.
  // These are exposed via CORS `exposedHeaders` in index.ts.
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('X-Dicom-Rows', study.metadata.rows);
  res.setHeader('X-Dicom-Columns', study.metadata.columns);
  res.setHeader('X-Dicom-Bits-Allocated', study.metadata.bitsAllocated);
  res.setHeader('X-Dicom-Pixel-Representation', study.metadata.pixelRepresentation ?? 0);
  res.setHeader('X-Dicom-Window-Center', study.metadata.windowCenter);
  res.setHeader('X-Dicom-Window-Width', study.metadata.windowWidth);

  // Zero-copy: subarray returns a view into the same buffer, no allocation
  const pixelData = study.buffer.subarray(frameOffset, frameEnd);
  res.send(pixelData);
});

// GET /api/dicom/:studyId/thumbnail (JPEG preview, 256px wide)
router.get('/:studyId/thumbnail', validateStudyId, async (req, res, next) => {
  try {
    const study = studyStoreService.get(req.params.studyId);
    if (!study) {
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    const thumbnail = await dicomParserService.renderThumbnail(
      study.buffer,
      study.pixelDataOffset,
      study.pixelDataLength,
      study.metadata
    );
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(thumbnail);
  } catch (error) {
    next(error);
  }
});

export { router as dicomRouter };

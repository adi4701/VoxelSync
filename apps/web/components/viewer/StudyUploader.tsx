import { useState, useRef } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { DicomMetadata } from '@voxelsync/types';
import { useViewportSync } from '@/hooks/useViewportSync';

interface StudyUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (studyId: string, metadata: DicomMetadata) => void;
}

export function StudyUploader({ isOpen, onClose, onUploadSuccess }: StudyUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendStudyCommand } = useViewportSync();

  if (!isOpen) return null;

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // In production, use NEXT_PUBLIC_DICOM_SERVER_URL
      const serverUrl = process.env.NEXT_PUBLIC_DICOM_SERVER_URL || 'http://localhost:3001';
      
      const res = await fetch(`${serverUrl}/api/dicom/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Upload failed');
      }

      const { studyId, metadata } = await res.json();
      
      // Notify other peers to load this study
      sendStudyCommand({
        type: 'study-load',
        studyId,
        seriesId: metadata.seriesInstanceUid,
        metadata,
        frameCount: metadata.numberOfFrames,
      });

      onUploadSuccess(studyId, metadata);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h3 className="text-xl font-bold text-white mb-6">Upload DICOM Study</h3>

        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            isUploading 
              ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed' 
              : 'border-slate-700 hover:border-blue-500 hover:bg-slate-800/50'
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
              <p className="text-slate-300 font-medium">Processing DICOM...</p>
            </>
          ) : (
            <>
              <UploadCloud className="text-slate-400 mb-4" size={48} />
              <p className="text-slate-300 font-medium mb-1">Click to select DICOM file</p>
              <p className="text-slate-500 text-sm">.dcm files only (max 500MB)</p>
            </>
          )}
          <input 
            type="file" 
            accept=".dcm,application/dicom" 
            className="hidden" 
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleUpload(e.target.files[0]);
            }}
          />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

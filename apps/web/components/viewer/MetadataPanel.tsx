import { DicomMetadata } from '@voxelsync/types';
import { Info, User, Calendar, Activity } from 'lucide-react';

interface MetadataPanelProps {
  metadata: DicomMetadata | null;
}

export function MetadataPanel({ metadata }: MetadataPanelProps) {
  if (!metadata) return null;

  return (
    <div className="absolute top-4 left-4 w-64 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl z-20">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Info size={14} />
        Study Info
      </h4>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <User size={16} className="text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-200">{metadata.patientName}</p>
            <p className="text-xs text-slate-500">{metadata.patientId}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar size={16} className="text-emerald-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-200">{metadata.studyDate || 'N/A'}</p>
            <p className="text-xs text-slate-500">{metadata.studyDescription || 'No description'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Activity size={16} className="text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-200">{metadata.modality}</p>
            <p className="text-xs text-slate-500">
              {metadata.columns}x{metadata.rows} • {metadata.bitsAllocated}-bit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

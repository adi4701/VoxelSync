import { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, side = 'top' }: TooltipProps) {
  const positions: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group inline-flex">
      {children}
      <div
        role="tooltip"
        className={`pointer-events-none absolute ${positions[side]} z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
      >
        <div className="px-2 py-1 bg-slate-800 text-slate-200 text-xs font-medium rounded-lg ring-1 ring-white/10 whitespace-nowrap shadow-xl">
          {content}
        </div>
      </div>
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'connected' | 'syncing' | 'uploading' | 'offline' | 'default';
  className?: string;
}

const variantStyles: Record<string, string> = {
  connected: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30',
  syncing: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30 animate-pulse',
  uploading: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30',
  offline: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30',
  default: 'bg-slate-700/50 text-slate-300 ring-1 ring-slate-600/30',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ glow = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-slate-900/60 backdrop-blur-xl rounded-2xl ring-1 ring-white/10 ${
        glow ? 'shadow-[0_0_40px_-10px_rgba(37,99,235,0.25)]' : 'shadow-xl'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

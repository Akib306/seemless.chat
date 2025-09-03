import { GlowEffect } from '@/components/ui/glow-effect';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

interface GlowEffectButtonProps {
  children?: ReactNode;
  href?: string;
  className?: string;
  showArrow?: boolean;
  onClick?: () => void;
}

export function GlowEffectButton({ 
  children = "Explore", 
  href, 
  className = "", 
  showArrow = true,
  onClick 
}: GlowEffectButtonProps) {
  const buttonContent = (
    <div className='relative'>
      <GlowEffect
        colors={['#FF5733', '#33FF57', '#3357FF', '#F1C40F']}
        mode='colorShift'
        blur='soft'
        duration={3}
        scale={1.0}
      />
      <button 
        className={`relative inline-flex items-center gap-1 rounded-md bg-zinc-950 px-4 py-2 text-sm text-zinc-50 outline outline-1 outline-[#fff2f21f] hover:bg-zinc-900 transition-colors ${className}`}
        onClick={onClick}
      >
        {children} {showArrow && <ArrowRight className='h-4 w-4' />}
      </button>
    </div>
  );

  if (href) {
    return <Link href={href}>{buttonContent}</Link>;
  }

  return buttonContent;
}

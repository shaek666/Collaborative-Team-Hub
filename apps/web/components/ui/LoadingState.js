import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const LoadingState = ({ className, label = 'Loading' }) => (
  <div className={cn('flex items-center justify-center h-64', className)} aria-label={label}>
    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
  </div>
);

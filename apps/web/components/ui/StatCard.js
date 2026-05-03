import React, { memo } from 'react';
import { Card, CardContent } from './Card';
import { cn } from '../../lib/utils';

export const StatCard = memo(({ label, value, icon: Icon, iconClassName, iconBgClassName, valueClassName }) => (
  <Card className="border-slate-800/50">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
          <h3 className={cn('text-3xl font-bold', valueClassName)}>{value}</h3>
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-xl bg-slate-800', iconBgClassName)}>
            <Icon className={cn('w-6 h-6 text-slate-400', iconClassName)} />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

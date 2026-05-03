import React, { memo } from 'react';
import { Card, CardContent } from './Card';

export const EmptyState = memo(({ icon: Icon, title, description, action }) => (
  <Card className="border-slate-800/50 bg-slate-900/30" role="status" aria-live="polite">
    <CardContent className="p-8 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
      <span className="sr-only">{title}</span>
    </CardContent>
  </Card>
));

EmptyState.displayName = 'EmptyState';

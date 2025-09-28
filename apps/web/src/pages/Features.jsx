import React, { useState } from 'react';
import { features, stats, featurePhases } from '../featuresStatus';
import { PageHeader } from '../components/ui/PageHeader';
import { Dialog } from '../components/ui/Dialog';
import { Skeleton } from '../components/ui/Skeleton';
import { TableShell } from '../components/ui/TableShell';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import '../styles.css';

const statusColor = (s) => ({
  'done': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'in-progress': 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  'partial': 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  'blocked': 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  'deferred': 'bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  'not-started': 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400'
})[s] || 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400';

export default function Features(){
  const s = stats();
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // placeholder for future async

  return (
    <div className="space-y-10">
      <PageHeader
        title="Feature Progress (Temporary)"
        description="MVP tracking dashboard. Remove after internal alignment."
        actions={
          <Button size="sm" onClick={() => setShowNew(true)}>
            Add Placeholder
          </Button>
        }
      />

      <section className="grid md:grid-cols-4 gap-4">
        {Object.entries(s.byPhase).map(([phase,data]) => (
          <div key={phase} className="rounded-lg border bg-card p-4 flex flex-col gap-1">
            <div className="text-xs uppercase text-muted-foreground font-medium tracking-wide">{phase}</div>
            <div className="text-2xl font-semibold leading-none">{data.done}/{data.total}</div>
            <div className="text-xs text-muted-foreground">{Math.round(data.done/data.total*100)}% complete</div>
          </div>
        ))}
        <div className="rounded-lg border bg-card p-4 flex flex-col gap-1">
          <div className="text-xs uppercase text-muted-foreground font-medium tracking-wide">Total</div>
          <div className="text-2xl font-semibold leading-none">{s.statusCounts.done || 0}/{s.total}</div>
          <div className="text-xs text-muted-foreground">Overall</div>
        </div>
      </section>

      <div className="space-y-12">
        {featurePhases.map(phase => {
          const rows = features.filter(f=>f.phase===phase);
          return (
            <div key={phase} className="space-y-4">
              <header className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">{phase}</h2>
                <Badge variant="secondary">{rows.length} items</Badge>
              </header>
              <TableShell
                headers={['Feature','Status','Owner','Notes']}
                emptyMessage="No features in this phase"
              >
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="py-6"><Skeleton className="h-5 w-40" /></td>
                  </tr>
                )}
                {!isLoading && rows.map(f => (
                  <tr key={f.key} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2 pr-4 font-medium align-top min-w-[14rem]">{f.title}</td>
                    <td className="py-2 pr-4 align-top">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium inline-flex items-center ${statusColor(f.status)}`}>{f.status}</span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground align-top whitespace-nowrap">{f.owner || '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground align-top max-w-[40ch]">{f.notes || ''}</td>
                  </tr>
                ))}
              </TableShell>
            </div>
          );
        })}
      </div>

      <Dialog
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Add Placeholder Feature"
        footer={(
          <>
            <Button variant="ghost" onClick={()=>setShowNew(false)}>Cancel</Button>
            <Button disabled>Add (Stub)</Button>
          </>
        )}
      >
        <p className="text-sm text-muted-foreground">This dialog is a stub to demonstrate the design system. Future functionality will allow adding or annotating features directly.</p>
      </Dialog>
    </div>
  );
}

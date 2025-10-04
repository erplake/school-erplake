import React from 'react';
import { motion } from 'framer-motion';

export function KPI({ icon, label, value, tone }) {
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-50 grid place-content-center text-slate-600">
          {icon}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{label}</div>
          <div className="text-lg font-semibold tabular-nums" data-tone={tone}>{value}</div>
        </div>
      </div>
    </motion.div>
  );
}

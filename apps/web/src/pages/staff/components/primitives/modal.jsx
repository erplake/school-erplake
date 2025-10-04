import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Modal({ children, onClose, open=true, size='lg', maxWidth }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div initial={{y:24,opacity:0}} animate={{y:0,opacity:1}} exit={{y:24,opacity:0}} className={`relative z-10 w-full ${maxWidth || (size==='lg'?'max-w-2xl':'max-w-lg')} rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl`}> 
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

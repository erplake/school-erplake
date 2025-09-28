import React, { useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

// Improved Dialog with portal, rudimentary focus trap, scroll lock
export function Dialog({ open, onClose, title, children, footer, size = 'md', initialFocus }) {
  const ref = useRef(null);
  const lastFocusRef = useRef(null);

  // Build a container for portals on first use
  const portalEl = useRef(null);
  if (!portalEl.current && typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.setAttribute('data-dialog-portal', '');
    document.body.appendChild(el);
    portalEl.current = el;
  }

  const close = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    function onKey(e){
      if(e.key === 'Escape' && open){
        e.preventDefault();
        close();
      }
      if(e.key === 'Tab' && open){
        // Focus trap cycle
        const focusables = ref.current?.querySelectorAll('[href],button,textarea,input,select,[tabindex]:not([tabindex="-1"])');
        if(!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if(e.shiftKey && document.activeElement === first){
          e.preventDefault();
            last.focus();
        } else if(!e.shiftKey && document.activeElement === last){
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if(open){
      lastFocusRef.current = document.activeElement;
      const toFocus = (typeof initialFocus === 'function' ? initialFocus() : initialFocus) || ref.current?.querySelector('[data-autofocus]') || ref.current;
      toFocus && setTimeout(()=> toFocus.focus(), 10);
      // Scroll lock
      const prevOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = prevOverflow;
        lastFocusRef.current && lastFocusRef.current.focus();
      };
    }
  }, [open, initialFocus]);

  useEffect(() => () => {
    // Cleanup portal on unmount
    if(portalEl.current){
      try { document.body.removeChild(portalEl.current); } catch {}
    }
  }, []);

  if(!open || !portalEl.current) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const node = (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={close} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : undefined}
          className={clsx('relative w-full rounded-lg border bg-card text-card-foreground shadow-lg focus:outline-none outline-none', sizes[size])}
          ref={ref}
          tabIndex={-1}
        >
          {(title || onClose) && (
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="font-medium text-lg leading-none">{title}</div>
              {onClose && (
                <button onClick={close} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close dialog">✕</button>
              )}
            </div>
          )}
          <div className="px-5 py-4 space-y-4">
            {children}
          </div>
          {footer && (
            <div className="px-5 py-4 border-t bg-muted/40 rounded-b-lg flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, portalEl.current);
}

export default Dialog;

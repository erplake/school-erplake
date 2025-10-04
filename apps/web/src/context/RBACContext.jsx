import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Capability taxonomy (expandable). Pattern: domain.action
export const CAPABILITIES = [
  // Students
  'student.view','student.edit','student.import',
  // Admissions
  'admissions.view','admissions.manage',
  // Staff & HR
  'staff.view','staff.edit','hr.payroll.view','hr.payroll.edit','hr.recruitment.manage',
  // Staff taxonomy management (maps to backend permission staff:taxonomy)
  'staff:taxonomy',
  // Discipline / future
  'discipline.view','discipline.manage',
  // Attendance & risk
  'attendance.view','attendance.analytics.view','attendance.intervention.manage',
  // Finance
  'finance.fees.view','finance.fees.manage','finance.scholarship.manage','finance.invoices.view','finance.invoices.manage',
  // Procurement / assets
  'procurement.rfq.create','procurement.po.manage','procurement.grn.manage','procurement.invoice.match',
  'asset.view','asset.manage','asset.depreciation.run',
  // Library & Academics
  'library.view','library.manage','academics.planner.view','academics.planner.manage','academics.curriculum.manage',
  // Templates & Data Ops
  'template.manage','import.run','export.run','backup.export',
  // Leadership / approvals
  'approval.manage','leadership.dashboard.view',
  // RBAC
  'rbac.manage'
];

const DEFAULT_ROLES = {
  Admin: CAPABILITIES,
  Principal: [ 'leadership.dashboard.view','approval.manage','student.view','staff.view','attendance.view','attendance.analytics.view','finance.fees.view','finance.invoices.view','academics.planner.view','library.view','template.manage','admissions.view' ],
  Teacher: [ 'student.view','attendance.view','academics.planner.view','library.view' ],
  Accountant: [ 'finance.fees.view','finance.fees.manage','finance.invoices.view','finance.invoices.manage','export.run' ],
  Librarian: [ 'library.view','library.manage','import.run','export.run' ],
  HR: [ 'staff.view','staff.edit','staff:taxonomy','hr.payroll.view','hr.payroll.edit','hr.recruitment.manage','export.run' ],
};

const STORAGE_KEY = 'rbac_state_v1';

const RBACContext = createContext(null);

export function RBACProvider({ children }){
  const [roles,setRoles] = useState(()=>{
    try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw).roles; }catch{} return DEFAULT_ROLES; });
  const [userRole,setUserRole] = useState(()=>{ try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw).userRole||'Admin'; }catch{} return 'Admin'; });

  // Capability migration: ensure newly introduced capabilities are present where expected
  useEffect(()=>{
    setRoles(prev => {
      // If using stored roles (not reference equal to DEFAULT_ROLES), patch in staff:taxonomy for Admin & HR
      const next = { ...prev };
      ['Admin','HR'].forEach(r => {
        if(next[r]){
          const caps = new Set(next[r]);
            if(!caps.has('staff:taxonomy')){
              // Admin gets all capabilities; HR explicitly includes staff:taxonomy
              caps.add('staff:taxonomy');
              next[r] = Array.from(caps);
            }
        }
      });
      return next;
    });
  },[]);

  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({ roles, userRole })); }catch{} },[roles,userRole]);

  const hasCapability = useCallback((cap)=>{
    const list = roles[userRole] || [];
    return list.includes(cap);
  },[roles,userRole]);

  const updateRoleCaps = (role, caps) => {
    setRoles(r=> ({ ...r, [role]: caps.filter(c=> CAPABILITIES.includes(c)) }));
  };
  const addRole = (roleName) => { if(!roleName || roles[roleName]) return; setRoles(r=> ({...r,[roleName]:[]})); };
  const removeRole = (roleName) => { if(!roles[roleName]) return; setRoles(r=> { const copy={...r}; delete copy[roleName]; return copy; }); };

  return <RBACContext.Provider value={{ roles,userRole,setUserRole,hasCapability,updateRoleCaps,addRole,removeRole }}>
    {children}
  </RBACContext.Provider>;
}

export function useRBAC(){
  const ctx = useContext(RBACContext);
  if(!ctx) throw new Error('useRBAC must be used within RBACProvider');
  return ctx;
}

export function RequireCapability({ capability, children, fallback=null }){
  const { hasCapability } = useRBAC();
  return hasCapability(capability)? children : fallback;
}

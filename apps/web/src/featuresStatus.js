// Canonical feature status registry (temporary – remove post MVP)
// Phases: foundation, core-mvp, enhancement, polish, backlog
// Status: not-started, in-progress, blocked, done, deferred, partial
export const featurePhases = [
  'foundation','core-mvp','enhancement','polish','backlog'
];

export const features = [
  // Foundation
  { key: 'infra-postgres', title: 'Postgres Schema & Migrations', phase: 'foundation', status: 'done', owner: 'backend', notes: 'Alembic 0001-0005 applied' },
  { key: 'auth-otp', title: 'OTP Auth + JWT', phase: 'foundation', status: 'done', owner: 'backend', notes: 'MVP lacks refresh rotation hardening' },
  { key: 'core-models', title: 'Core Domain Models', phase: 'foundation', status: 'done', owner: 'backend', notes: 'Users, Students, Fees, Attendance' },
  { key: 'frontend-shell', title: 'React Shell + Layout + Dark Mode', phase: 'foundation', status: 'done', owner: 'frontend' },
  { key: 'storage-drivers', title: 'Storage Abstraction (local/S3)', phase: 'foundation', status: 'partial', owner: 'backend', notes: 'GDrive placeholder' },
  // Core MVP
  { key: 'fees-invoices', title: 'Fees & Invoices API', phase: 'core-mvp', status: 'done', owner: 'backend' },
  { key: 'attendance', title: 'Attendance Tracking API', phase: 'core-mvp', status: 'done', owner: 'backend' },
  { key: 'students-ui', title: 'Students UI Page', phase: 'core-mvp', status: 'done', owner: 'frontend' },
  { key: 'chat-basics', title: 'Parent/Staff Chat (Conversations/Messages)', phase: 'core-mvp', status: 'done', owner: 'backend', notes: 'Sequence trigger + FTS search' },
  { key: 'events', title: 'Events CRUD & Calendar Base', phase: 'core-mvp', status: 'done', owner: 'backend' },
  { key: 'social-posts', title: 'Social Posts Scheduling', phase: 'core-mvp', status: 'done', owner: 'backend' },
  { key: 'brand-settings', title: 'Brand / Theme Settings', phase: 'core-mvp', status: 'done', owner: 'backend' },
  { key: 'search-fts', title: 'Full-Text Search (Chat & Social)', phase: 'core-mvp', status: 'done', owner: 'backend' },
  // Enhancement
  { key: 'chat-websocket', title: 'Realtime Chat WebSocket Persistence', phase: 'enhancement', status: 'not-started', owner: 'backend', notes: 'Currently broadcast only, no persistence on WS path' },
  { key: 'rate-limit-distributed', title: 'Distributed Rate Limiting', phase: 'enhancement', status: 'not-started', owner: 'backend', notes: 'In-memory only now' },
  { key: 'search-language-ext', title: 'Multi-language FTS (per field)', phase: 'enhancement', status: 'not-started', owner: 'backend' },
  { key: 'tests-e2e', title: 'E2E Test Suite', phase: 'enhancement', status: 'not-started', owner: 'qa' },
  { key: 'rbac-expansion', title: 'Granular RBAC Roles', phase: 'enhancement', status: 'not-started', owner: 'backend' },
  { key: 'worker-jobs', title: 'Async Worker Jobs (PDF/Reports)', phase: 'enhancement', status: 'not-started', owner: 'backend' },
  // Polish
  { key: 'ui-accessibility', title: 'Accessibility Pass (a11y)', phase: 'polish', status: 'not-started', owner: 'frontend' },
  { key: 'perf-tuning', title: 'DB & API Performance Tuning', phase: 'polish', status: 'not-started', owner: 'backend' },
  { key: 'error-ux', title: 'Frontend Error UX', phase: 'polish', status: 'not-started', owner: 'frontend' },
  // Backlog
  { key: 'library-module', title: 'Library / Circulation', phase: 'backlog', status: 'not-started', owner: 'backend' },
  { key: 'transport-module', title: 'Transport Routing', phase: 'backlog', status: 'not-started', owner: 'backend' },
  { key: 'exam-analytics', title: 'Exam Analytics Dashboards', phase: 'backlog', status: 'not-started', owner: 'frontend' },
  { key: 'parent-portal-polish', title: 'Parent Portal Polish', phase: 'backlog', status: 'not-started', owner: 'frontend' },
  // Newly added placeholders
  { key: 'workshops', title: 'Workshops Module', phase: 'backlog', status: 'not-started', owner: 'frontend' },
  { key: 'co-scholastic', title: 'Co-Scholastic Activities', phase: 'backlog', status: 'not-started', owner: 'frontend' },
  { key: 'labs', title: 'School Labs Management', phase: 'backlog', status: 'not-started', owner: 'backend' },
  { key: 'staff-mgmt', title: 'Staff Management', phase: 'enhancement', status: 'not-started', owner: 'backend' },
  { key: 'lesson-plans', title: 'Lesson Plans & Curriculum Mapping', phase: 'enhancement', status: 'not-started', owner: 'frontend' },
  { key: 'engagement', title: 'Engagement Metrics & Social Integrations', phase: 'enhancement', status: 'not-started', owner: 'backend' },
  { key: 'events-engagement', title: 'Events Engagement & Attendance', phase: 'enhancement', status: 'not-started', owner: 'backend' },
  { key: 'external-events', title: 'External / Olympiad Events', phase: 'backlog', status: 'not-started', owner: 'backend' },
  { key: 'parent-feedback', title: 'Parent Feedback', phase: 'enhancement', status: 'not-started', owner: 'frontend' },
  { key: 'parents-connect', title: 'Parents Connect (Forum)', phase: 'enhancement', status: 'not-started', owner: 'backend' },
  { key: 'parent-groups', title: 'Parent Groups', phase: 'enhancement', status: 'not-started', owner: 'backend' },
];

export function stats(){
  const byPhase = {};
  const statusCounts = {};
  for (const f of features){
    byPhase[f.phase] = byPhase[f.phase] || { total:0, done:0 };
    byPhase[f.phase].total += 1;
    if (f.status === 'done') byPhase[f.phase].done += 1;
    statusCounts[f.status] = (statusCounts[f.status]||0)+1;
  }
  return { byPhase, statusCounts, total: features.length };
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Fees from './pages/Fees';
import Attendance from './pages/Attendance';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import BrandSettings from './pages/settings/Brand';
// Exams & Grades
import ExamsOverview from './pages/exams/ExamsOverview';
import ExamSetup from './pages/exams/ExamSetup';
import MarksEntry from './pages/exams/MarksEntry';
import ReportCards from './pages/exams/ReportCards';
// Timetable
import Timetable from './pages/timetable/Timetable';
// Library
import Library from './pages/library/Library';
// Transport
import Transport from './pages/transport/Transport';
import TransportManagement from './pages/transport/TransportManagement';
// Staff (directory import removed here; single consolidated import appears later)
// Notifications
import NotificationsCenter from './pages/notifications/NotificationsCenter';
// Auth
import Login from './pages/auth/Login';
import OtpVerify from './pages/auth/OtpVerify';
// Profile
import Profile from './pages/profile/Profile';
// Homework
import HomeworkList from './pages/homework/HomeworkList';
import HomeworkAssign from './pages/homework/HomeworkAssign';
import ParentHomeworkView from './pages/homework/ParentHomeworkView';
// Comms
import Announcements from './pages/comms/Announcements';
import DigitalDiary from './pages/comms/DigitalDiary';
import LeaveRequests from './pages/comms/LeaveRequests';
import LeaveApprovals from './pages/comms/LeaveApprovals';
import CommsHub from './pages/comms/CommsHub';
// Payroll
import SalaryComponents from './pages/payroll/SalaryComponents';
import Payslips from './pages/payroll/Payslips';
import InventoryCatalog from './pages/payroll/InventoryCatalog';
import InventoryTransactions from './pages/payroll/InventoryTransactions';
// Analytics
import AttendanceAnalytics from './pages/analytics/AttendanceAnalytics';
import FeeAnalytics from './pages/analytics/FeeAnalytics';
import HomeworkAnalytics from './pages/analytics/HomeworkAnalytics';
// Classes management
import Classes from './pages/classes/Classes';
import Subjects from './pages/classes/Subjects';
import TeacherAssignment from './pages/classes/TeacherAssignment';
// Parent portal
import ParentProfile from './pages/parent/ParentProfile';
import ParentAttendanceFeed from './pages/parent/ParentAttendanceFeed';
import ParentFeedback from './pages/parent/ParentFeedback';
import ParentsConnect from './pages/parent/ParentsConnect';
import ParentGroups from './pages/parent/ParentGroups';
// Audit & Theme
import AuditLog from './pages/audit/AuditLog';
import ThemeSettings from './pages/theme/ThemeSettings';
// Events
import EventsCalendar from './pages/events/EventsCalendar';
import EventList from './pages/events/EventList';
import EventCreate from './pages/events/EventCreate';
// social
import SocialPosts from './pages/social/SocialPosts';
import SocialSchedule from './pages/social/SocialSchedule';
import SocialAnalytics from './pages/social/SocialAnalytics';
// chats
import ParentChats from './pages/chats/ParentChats';
import ChatModeration from './pages/chats/ChatModeration';
import Features from './pages/Features';
import Workshops from './pages/workshops/Workshops';
import CoScholastic from './pages/coscholastic/CoScholastic';
import SchoolLabs from './pages/labs/SchoolLabs';
import StaffManagement from './pages/staff/StaffManagement';
import StaffDirectory from './pages/staff/StaffDirectory';
import LessonPlans from './pages/academics/LessonPlans';
import ClassroomManagement from './pages/core/Classroom';
import EventsEngagement from './pages/events/EventsEngagement';
import ExternalEvents from './pages/events/ExternalEvents';
import Engagement from './pages/engagement/Engagement';
// New enrichment modules
import CareerCounsellingPage from './pages/enrichment/CareerCounselling.jsx';
import LabManagement from './pages/enrichment/LabManagement.jsx';
import WorkshopManagement from './pages/enrichment/WorkshopManagement.jsx';
import SportsDivision from './pages/enrichment/SportsDivision.jsx';
import ClubsActivitiesManager from './pages/enrichment/ClubsActivitiesManager.jsx';
// Health & Houses
import Infirmary from './pages/health/Infirmary.jsx';
import HouseManagement from './pages/houses/HouseManagement.jsx';
// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClass from './pages/teacher/TeacherClass';
import ClassTeacherTools from './pages/teacher/ClassTeacherTools';
import TeacherPlannerPage from './pages/teacher/TeacherPlannerPage.jsx';
// New standalone modules
import InventoryPage from './pages/inventory/Inventory.jsx';
import CompliancePage from './pages/compliance/Compliance.jsx';
import LessonPlanner from './pages/planner/LessonPlanner.jsx';
import Planner from './pages/planner/Planner.jsx';
import FinanceAccounting from './pages/finance/FinanceAccounting.jsx';
import CurriculumPlanner from './pages/academics/CurriculumPlanner.jsx';
import AdvancedInvoices from './pages/finance/AdvancedInvoices.jsx';
import AdvancedLessonCurriculum from './pages/planner/AdvancedLessonCurriculum.jsx';
// Headmistress portal (new consolidated)
import HeadmistressPortal from './pages/headmistress/HeadmistressPortal.jsx';
import StudentDashboardPreview from './pages/student/StudentDashboardPreview.jsx';
import MarketingPortal from './pages/marketing/MarketingPortal.jsx';
// Admissions & Operations
import AdmissionsManagement from './pages/admissions/AdmissionsManagement.jsx';
import CapacityUtilizationManager from './pages/operations/CapacityUtilizationManager.jsx';
import VendorManagementPage from './pages/operations/VendorManagementPage.jsx';
import SecuritySupportStaffPage from './pages/operations/SecuritySupportStaffPage.jsx';
// HR / Principal / Advanced Library
import HRDeskPage from './pages/hr/HRDeskPage.jsx';
import PrincipalDesk from './pages/principal/PrincipalDesk.jsx';
import LibraryManagementAdvanced from './pages/library/LibraryManagementAdvanced.jsx';

import './styles.css';
import { GlobalSettingsProvider } from './context/GlobalSettingsContext';
import { RBACProvider } from './context/RBACContext.jsx';
import { TemplateProvider } from './context/TemplateContext.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
// System new pages
import RBACManagement from './pages/system/RBACManagement.jsx';
import TemplateManager from './pages/system/TemplateManager.jsx';
import ImportCenter from './pages/system/ImportCenter.jsx';
import DisciplineCenter from './pages/discipline/DisciplineCenter.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const root = createRoot(document.getElementById('root'));
const queryClient = new QueryClient();
root.render(
                <BrowserRouter>
                        <GlobalSettingsProvider>
                        <RBACProvider>
                        <TemplateProvider>
                        <ToastProvider>
                            <QueryClientProvider client={queryClient}>
                                <Routes>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/verify" element={<OtpVerify />} />
            <Route path="/parent/homework" element={<ParentHomeworkView />} />
            <Route path="/parent/profile" element={<ParentProfile />} />
            <Route path="/parent/feedback" element={<ParentFeedback />} />
            <Route path="/parent/connect" element={<ParentsConnect />} />
            <Route path="/parent/groups" element={<ParentGroups />} />
            <Route path="/" element={<Layout />}> 
                <Route index element={<Dashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="fees" element={<Fees />} />
            <Route path="/parent/homework" element={<ParentHomeworkView />} />
            {/* Parent Invoices (relocated) */}
            <Route path="/parent/invoices" element={<Invoices />} />
            <Route path="/parent/invoices/preview" element={<AdvancedInvoices />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="settings">
                    <Route index element={<Settings />} />
                    <Route path="brand" element={<BrandSettings />} />
                </Route>
                {/* Moved invoices under parent namespace; keep legacy path commented for reference */}
                {/* <Route path="invoices" element={<Invoices />} /> */}
                <Route path="exams">
                    <Route index element={<ExamsOverview />} />
                    <Route path="setup" element={<ExamSetup />} />
                    <Route path="marks" element={<MarksEntry />} />
                    <Route path="reports" element={<ReportCards />} />
                </Route>
                <Route path="timetable" element={<Timetable />} />
                <Route path="library" element={<Library />} />
                <Route path="transport">
                    <Route index element={<Transport />} />
                    <Route path="management" element={<TransportManagement />} />
                </Route>
                {/* Core aliases for transport */}
                <Route path="core/transport" element={<Transport />} />
                <Route path="core/transport/management" element={<TransportManagement />} />
                {/* Staff main path now shows Management dashboard */}
                <Route path="staff" element={<StaffManagement />} />
                <Route path="notifications" element={<NotificationsCenter />} />
                <Route path="profile" element={<Profile />} />

                <Route path="homework">
                    <Route index element={<HomeworkList />} />
                    <Route path="assign" element={<HomeworkAssign />} />
                </Route>
                <Route path="comms">
                    <Route path="announcements" element={<Announcements />} />
                    <Route path="diary" element={<DigitalDiary />} />
                    <Route path="leave-requests" element={<LeaveRequests />} />
                    <Route path="leave-approvals" element={<LeaveApprovals />} />
                    <Route path="hub" element={<CommsHub />} />
                </Route>
                <Route path="payroll">
                    <Route path="components" element={<SalaryComponents />} />
                    <Route path="payslips" element={<Payslips />} />
                    <Route path="inventory">
                        <Route index element={<InventoryCatalog />} />
                        <Route path="transactions" element={<InventoryTransactions />} />
                    </Route>
                </Route>
                <Route path="analytics">
                    <Route path="attendance" element={<AttendanceAnalytics />} />
                    <Route path="fees" element={<FeeAnalytics />} />
                    <Route path="homework" element={<HomeworkAnalytics />} />
                </Route>
                <Route path="classes">
                    <Route index element={<Classes />} />
                    <Route path="subjects" element={<Subjects />} />
                    <Route path="teachers" element={<TeacherAssignment />} />
                </Route>
                <Route path="audit" element={<AuditLog />} />
                <Route path="theme" element={<ThemeSettings />} />
                <Route path="events">
                    <Route index element={<EventsCalendar />} />
                    <Route path="list" element={<EventList />} />
                    <Route path="create" element={<EventCreate />} />
                </Route>
                <Route path="social">
                    <Route path="posts" element={<SocialPosts />} />
                    <Route path="schedule" element={<SocialSchedule />} />
                    <Route path="analytics" element={<SocialAnalytics />} />
                </Route>
                <Route path="chats">
                    <Route path="parents" element={<ParentChats />} />
                    <Route path="moderation" element={<ChatModeration />} />
                </Route>
                <Route path="features" element={<Features />} />
                <Route path="discipline" element={<DisciplineCenter />} />
                {/* System Foundations */}
                <Route path="system/rbac" element={<RBACManagement />} />
                <Route path="system/templates" element={<TemplateManager />} />
                <Route path="system/import-center" element={<ImportCenter />} />
                <Route path="teacher">
                    <Route index element={<TeacherDashboard />} />
                    <Route path="class/:classId" element={<TeacherClass />} />
                    <Route path="class/:classId/tools" element={<ClassTeacherTools />} />
                    <Route path="planner" element={<TeacherPlannerPage />} />
                </Route>
                {/* New standalone pages */}
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="compliance" element={<CompliancePage />} />
                <Route path="lesson-planner" element={<LessonPlanner />} />
                <Route path="planner" element={<Planner />} />
                <Route path="curriculum-planner" element={<CurriculumPlanner />} />
                <Route path="lesson-curriculum-advanced" element={<AdvancedLessonCurriculum />} />
                <Route path="headmistress/portal" element={<HeadmistressPortal />} />
                <Route path="student/dashboard-preview" element={<StudentDashboardPreview />} />
                <Route path="marketing/portal" element={<MarketingPortal />} />
                <Route path="finance" element={<FinanceAccounting />} />
                <Route path="invoices/preview" element={<AdvancedInvoices />} />
                <Route path="workshops" element={<Workshops />} />
                <Route path="activities" element={<CoScholastic />} />
                <Route path="labs" element={<SchoolLabs />} />
                {/* Explicit alias to management plus directory sub-route */}
                {/* Legacy preview path relocated under parent */}
                {/* <Route path="invoices/preview" element={<AdvancedInvoices />} /> */}
                <Route path="staff/directory" element={<StaffDirectory />} />
                {/* Core aliases for staff */}
                <Route path="core/staff" element={<StaffManagement />} />
                <Route path="core/staff/directory" element={<StaffDirectory />} />
                <Route path="academics/lesson-plans" element={<LessonPlans />} />
                {/* Classroom (core) */}
                <Route path="core/classroom" element={<ClassroomManagement />} />
                <Route path="engagement" element={<Engagement />} />
                <Route path="events/engagement" element={<EventsEngagement />} />
                <Route path="events/external" element={<ExternalEvents />} />
                {/* Enrichment extensions */}
                <Route path="enrichment/career-counselling" element={<CareerCounsellingPage />} />
                <Route path="enrichment/labs/management" element={<LabManagement />} />
                <Route path="enrichment/workshops/management" element={<WorkshopManagement />} />
                <Route path="enrichment/sports-division" element={<SportsDivision />} />
                <Route path="enrichment/clubs-activities" element={<ClubsActivitiesManager />} />
                {/* Health & Houses */}
                <Route path="health/infirmary" element={<Infirmary />} />
                <Route path="houses/management" element={<HouseManagement />} />
                {/* Admissions & Operations */}
                <Route path="admissions/management" element={<AdmissionsManagement />} />
                <Route path="operations/capacity" element={<CapacityUtilizationManager />} />
                <Route path="operations/vendors" element={<VendorManagementPage />} />
                <Route path="operations/security-support" element={<SecuritySupportStaffPage />} />
                {/* HR / Principal / Advanced Library */}
                <Route path="hr/desk" element={<HRDeskPage />} />
                <Route path="principal/desk" element={<PrincipalDesk />} />
                <Route path="library/management-advanced" element={<LibraryManagementAdvanced />} />
            </Route>
                                </Routes>
                                <ReactQueryDevtools initialIsOpen={false} />
                            </QueryClientProvider>
                        </ToastProvider>
                        </TemplateProvider>
                        </RBACProvider>
                        </GlobalSettingsProvider>
        </BrowserRouter>
);

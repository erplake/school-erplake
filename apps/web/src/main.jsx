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
// Staff
import StaffDirectory from './pages/staff/StaffDirectory';
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
import LessonPlans from './pages/academics/LessonPlans';
import Engagement from './pages/engagement/Engagement';
import EventsEngagement from './pages/events/EventsEngagement';
import ExternalEvents from './pages/events/ExternalEvents';

import './styles.css';
import { GlobalSettingsProvider } from './context/GlobalSettingsContext';

const root = createRoot(document.getElementById('root'));
root.render(
        <BrowserRouter>
            <GlobalSettingsProvider>
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
                <Route path="attendance" element={<Attendance />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="settings">
                    <Route index element={<Settings />} />
                    <Route path="brand" element={<BrandSettings />} />
                </Route>

                <Route path="exams">
                    <Route index element={<ExamsOverview />} />
                    <Route path="setup" element={<ExamSetup />} />
                    <Route path="marks" element={<MarksEntry />} />
                    <Route path="reports" element={<ReportCards />} />
                </Route>
                <Route path="timetable" element={<Timetable />} />
                <Route path="library" element={<Library />} />
                <Route path="transport" element={<Transport />} />
                <Route path="staff" element={<StaffDirectory />} />
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
                <Route path="workshops" element={<Workshops />} />
                <Route path="activities" element={<CoScholastic />} />
                <Route path="labs" element={<SchoolLabs />} />
                <Route path="staff/management" element={<StaffManagement />} />
                <Route path="academics/lesson-plans" element={<LessonPlans />} />
                <Route path="engagement" element={<Engagement />} />
                <Route path="events/engagement" element={<EventsEngagement />} />
                <Route path="events/external" element={<ExternalEvents />} />
            </Route>
                </Routes>
            </GlobalSettingsProvider>
        </BrowserRouter>
);

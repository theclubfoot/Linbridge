import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth } from './pages/Auth';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Attendance } from './pages/Attendance';
import { Payroll } from './pages/Payroll';
import { Performance } from './pages/Performance';
import { Announcements } from './pages/Announcements';
import { EmployeePortal } from './pages/employee/EmployeePortal';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { EmployeeAttendance } from './pages/employee/EmployeeAttendance';
import { EmployeeShifts } from './pages/employee/EmployeeShifts';
import { EmployeePayslips } from './pages/employee/EmployeePayslips';
import { EmployeePerformance } from './pages/employee/EmployeePerformance';
import { AdminShifts } from './pages/admin/AdminShifts';
import { AdminShiftRequests } from './pages/admin/AdminShiftRequests';
import { AdminShiftStats } from './pages/admin/AdminShiftStats';
import { AdminRegistration } from './pages/AdminRegistration';
import { PromoteToAdmin } from './pages/PromoteToAdmin';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Auth />} />
        <Route path="/admin-registration" element={<AdminRegistration />} />
        <Route path="/promote-to-admin" element={<PromoteToAdmin />} />
        
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Employee routes */}
        <Route path="/employee/*" element={
          <ProtectedRoute role="employee">
            <EmployeePortal />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="attendance" element={<EmployeeAttendance />} />
          <Route path="shifts" element={<EmployeeShifts />} />
          <Route path="payslips" element={<EmployeePayslips />} />
          <Route path="performance" element={<EmployeePerformance />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute role="admin">
            <Layout>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="employees" element={<Employees />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="payroll" element={<Payroll />} />
                <Route path="performance" element={<Performance />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="shifts" element={<AdminShifts />} />
                <Route path="shift-requests" element={<AdminShiftRequests />} />
                <Route path="shift-stats" element={<AdminShiftStats />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
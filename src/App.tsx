import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { ICEMLogin } from "@/pages/ICEMLogin";
import { IGSBLogin } from "@/pages/IGSBLogin";
import { SuperAdminDashboard } from "@/pages/superadmin/SuperAdminDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import FacultyDetails from "@/pages/admin/FacultyDetails";
import SessionResponses from "@/pages/admin/SessionResponses";
import { HodDashboard } from "@/pages/hod/HodDashboard";
import { FacultyDashboard } from "@/pages/faculty/FacultyDashboard";
import { AnonymousFeedback } from "@/pages/feedback/AnonymousFeedback";
import NotFound from "@/pages/NotFound";
import SeedData from "@/pages/SeedData";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/icem" element={<ICEMLogin />} />
            <Route path="/login/igsb" element={<IGSBLogin />} />
            <Route path="/feedback/anonymous/:sessionId" element={<AnonymousFeedback />} />
            <Route path="/seed-data" element={<SeedData />} />

            {/* Super Admin Routes */}
            <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/colleges" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/admins" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/sessions" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/sessions/:sessionId/responses" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/question-bank" element={<SuperAdminDashboard />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route element={<DashboardLayout allowedRoles={['admin', 'superAdmin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/sessions" element={<AdminDashboard />} />
              <Route path="/admin/sessions/:sessionId/responses" element={<SessionResponses />} />
              <Route path="/admin/departments" element={<AdminDashboard />} />
              <Route path="/admin/faculty" element={<AdminDashboard />} />
              <Route path="/admin/faculty-details" element={<FacultyDetails />} />
              <Route path="/admin/questions" element={<AdminDashboard />} />
              <Route path="/admin/reports" element={<AdminDashboard />} />
            </Route>

            {/* HOD Routes */}
            <Route element={<DashboardLayout allowedRoles={['hod']} />}>
              <Route path="/hod/dashboard" element={<HodDashboard />} />
              <Route path="/hod/faculty" element={<HodDashboard />} />
              <Route path="/hod/reports" element={<HodDashboard />} />
            </Route>

            {/* Faculty Routes */}
            <Route element={<DashboardLayout allowedRoles={['faculty']} />}>
              <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
              <Route path="/faculty/feedback" element={<FacultyDashboard />} />
              <Route path="/faculty/reports" element={<FacultyDashboard />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;

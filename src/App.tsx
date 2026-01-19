import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { HodDashboard } from "@/pages/hod/HodDashboard";
import { FacultyDashboard } from "@/pages/faculty/FacultyDashboard";
import { AnonymousFeedback } from "@/pages/feedback/AnonymousFeedback";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/feedback/anonymous" element={<AnonymousFeedback />} />

            {/* Admin Routes */}
            <Route element={<DashboardLayout allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/cycles" element={<AdminDashboard />} />
              <Route path="/admin/departments" element={<AdminDashboard />} />
              <Route path="/admin/faculty" element={<AdminDashboard />} />
              <Route path="/admin/questions" element={<AdminDashboard />} />
              <Route path="/admin/reports" element={<AdminDashboard />} />
              <Route path="/admin/settings" element={<AdminDashboard />} />
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

export default App;

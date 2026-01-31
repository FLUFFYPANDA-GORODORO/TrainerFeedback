import { ThemeProvider } from "next-themes";
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
import { SuperAdminDashboard } from "@/pages/superadmin/SuperAdminDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import SessionResponses from "@/pages/admin/SessionResponses";
import TrainerDashboard from "@/pages/trainer/TrainerDashboard";
import { AnonymousFeedback } from "@/pages/feedback/AnonymousFeedback";
import NotFound from "@/pages/NotFound";
import SeedData from "@/pages/SeedData";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/feedback/anonymous/:sessionId" element={<AnonymousFeedback />} />
                <Route path="/seed-data" element={<SeedData />} />

                {/* Super Admin Routes - has its own built-in layout */}
                <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
                <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/colleges" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/admins" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/trainers" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/sessions" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/sessions/:sessionId/responses" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/templates" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/academic-config" element={<SuperAdminDashboard />} />

                {/* College Admin Routes - has its own built-in layout */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/sessions" element={<AdminDashboard />} />
                <Route path="/admin/feedback" element={<AdminDashboard />} />
                <Route path="/admin/sessions/:sessionId/responses" element={<AdminDashboard />} />

                {/* Trainer Routes - has its own built-in layout */}
                <Route path="/trainer" element={<Navigate to="/trainer/dashboard" replace />} />
                <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
                <Route path="/trainer/sessions" element={<TrainerDashboard />} />
                <Route path="/trainer/feedback" element={<TrainerDashboard />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

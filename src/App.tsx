import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "@/components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Care from "./pages/Care";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import FamilyDashboard from "./pages/FamilyDashboard";
import FamilyCareScreen from "./pages/FamilyCareScreen";

import FamilyLogin from "./pages/FamilyLogin";
import DemoLanding from "./pages/DemoLanding";
import DemoSignup from "./pages/DemoSignup";
import DemoLogin from "./pages/DemoLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rota pública de login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rotas públicas do painel familiar */}
            <Route path="/family/login" element={<FamilyLogin />} />
            <Route path="/family/:patientId/:token" element={<FamilyDashboard />} />
            <Route path="/family/:patientId/:token/dashboard" element={<FamilyDashboard />} />
            <Route path="/family/:patientId/:token/care" element={<FamilyCareScreen />} />
            
            {/* Rotas públicas do demo */}
            <Route path="/demo" element={<DemoLanding />} />
            <Route path="/demo/signup" element={<DemoSignup />} />
            <Route path="/demo/login" element={<DemoLogin />} />
            <Route path="/demo/dashboard" element={
              <Layout>
                <Dashboard />
              </Layout>
            } />

            
            {/* Rotas protegidas */}
             <Route path="/" element={
               <ProtectedRoute>
                 <Layout>
                   <Outlet />
                 </Layout>
               </ProtectedRoute>
             }>
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="care" element={<Care />} />
              <Route path="care/:patientId" element={<Care />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={
                <ProtectedRoute requiredRole="admin">
                  <Settings />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { wagmiAdapter, queryClient } from "./lib/web3modal-config";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import Settlements from "./pages/Settlements";
import Settings from "./pages/Settings";
import PaymentLinks from "./pages/PaymentLinks";
import Checkout from "./pages/Checkout";
import Checkout2 from "./pages/Checkout2";
import DashboardLayout from "./layouts/DashboardLayout";
import NotFound from "./pages/NotFound";

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/checkout" element={<Checkout2 />} />

      {/* Protected routes - Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/payment-links" element={<PaymentLinks />} />
        <Route path="/settlements" element={<Settlements />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  // Initialize theme on mount
  useTheme();
  return <>{children}</>;
}

const App = () => (
  <WagmiProvider config={wagmiAdapter.wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeInitializer>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;

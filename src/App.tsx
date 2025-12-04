import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import ListingDetail from "./pages/ListingDetail";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import SellerProfile from "./pages/SellerProfile";
import Sell from "./pages/Sell";
import NewListing from "./pages/NewListing";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Wishlist from "./pages/Wishlist";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import HarmReduction from "./pages/HarmReduction";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Swaps from "./pages/Swaps";
import VPS from "./pages/VPS";
import Phone from "./pages/Phone";
import AI from "./pages/AI";
import VpnResources from "./pages/VpnResources";
import Philosophy from "./pages/Philosophy";
import GrapheneOS from "./pages/GrapheneOS";
import FiatOfframp from "./pages/FiatOfframp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/checkout/:orderId" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderTracking />} />
            <Route path="/seller/:id" element={<SellerProfile />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/sell/new" element={<NewListing />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/safety" element={<HarmReduction />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/swaps" element={<Swaps />} />
            <Route path="/vps" element={<VPS />} />
            <Route path="/phone" element={<Phone />} />
            <Route path="/ai" element={<AI />} />
            <Route path="/vpn-resources" element={<VpnResources />} />
            <Route path="/philosophy" element={<Philosophy />} />
            <Route path="/grapheneos" element={<GrapheneOS />} />
            <Route path="/cashout" element={<FiatOfframp />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

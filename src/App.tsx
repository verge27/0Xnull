import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { PrivateKeyAuthProvider } from "./hooks/usePrivateKeyAuth";
import { TokenProvider } from "./hooks/useToken";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { NetworkStatusBanner } from "./components/NetworkStatusBanner";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import ListingDetail from "./pages/ListingDetail";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import SellerProfile from "./pages/SellerProfile";
import Sell from "./pages/Sell";
import NewListing from "./pages/NewListing";
import EditListing from "./pages/EditListing";
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
import FiatOnramp from "./pages/FiatOnramp";
import ApiAnalytics from "./pages/ApiAnalytics";
import Voice from "./pages/Voice";
import Therapy from "./pages/Therapy";
import Kokoro from "./pages/Kokoro";
import Verify from "./pages/Verify";
import Support from "./pages/Support";
import Predictions from "./pages/Predictions";
import CryptoPredictions from "./pages/CryptoPredictions";
import SportsPredictions from "./pages/SportsPredictions";
import EsportsPredictions from "./pages/EsportsPredictions";
import CricketPredictions from "./pages/CricketPredictions";
import TorGuide from "./pages/TorGuide";
const queryClient = new QueryClient();

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NetworkStatusBanner />
        <BrowserRouter>
          <AuthProvider>
            <PrivateKeyAuthProvider>
              <TokenProvider>
                <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/checkout/:orderId" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderTracking />} />
            <Route path="/seller/:id" element={<SellerProfile />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/sell/new" element={<NewListing />} />
            <Route path="/sell/edit/:id" element={<EditListing />} />
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
            <Route path="/buy" element={<FiatOnramp />} />
            <Route path="/api-analytics" element={<ApiAnalytics />} />
            <Route path="/voice" element={<Voice />} />
            <Route path="/therapy" element={<Therapy />} />
            <Route path="/kokoro" element={<Kokoro />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/support" element={<Support />} />
            <Route path="/predictions" element={<CryptoPredictions />} />
            <Route path="/sports-predictions" element={<SportsPredictions />} />
            <Route path="/esports-predictions" element={<EsportsPredictions />} />
            <Route path="/cricket-predictions" element={<CricketPredictions />} />
            <Route path="/tor-guide" element={<TorGuide />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TokenProvider>
            </PrivateKeyAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import AIHub from "./pages/AIHub";
import VpnResources from "./pages/VpnResources";
import Philosophy from "./pages/Philosophy";
import GrapheneOS from "./pages/GrapheneOS";
import FiatOfframp from "./pages/FiatOfframp";
import FiatOnramp from "./pages/FiatOnramp";
import ApiAnalytics from "./pages/ApiAnalytics";
import Voice from "./pages/Voice";
import Kokoro from "./pages/Kokoro";
import Verify from "./pages/Verify";
import Support from "./pages/Support";
import CryptoPredictions from "./pages/CryptoPredictions";
import SportsPredictions from "./pages/SportsPredictions";
import EsportsPredictions from "./pages/EsportsPredictions";
import CricketPredictions from "./pages/CricketPredictions";
import StarcraftPredictions from "./pages/StarcraftPredictions";
import TorGuide from "./pages/TorGuide";
import HowBettingWorks from "./pages/HowBettingWorks";
import RussianMMA from "./pages/RussianMMA";
import Slap from "./pages/Slap";
import InfraHub from "./pages/InfraHub";
import PredictionsHub from "./pages/PredictionsHub";
import CombatSports from "./pages/CombatSports";
import GetStarted from "./pages/GetStarted";
import ApiDocs from "./pages/ApiDocs";
import MySlips from "./pages/MySlips";
import Payouts from "./pages/Payouts";

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
                  
                  {/* Marketplace */}
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/marketplace" element={<Navigate to="/browse" replace />} />
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
                  
                  {/* Predictions */}
                  <Route path="/predict" element={<PredictionsHub />} />
                  <Route path="/predictions" element={<CryptoPredictions />} />
                  <Route path="/sports-predictions" element={<SportsPredictions />} />
                  <Route path="/esports-predictions" element={<EsportsPredictions />} />
                  <Route path="/cricket-predictions" element={<CricketPredictions />} />
                  <Route path="/starcraft" element={<StarcraftPredictions />} />
                  
                  {/* Combat Sports */}
                  <Route path="/predictions/sports/combat" element={<CombatSports />} />
                  <Route path="/predictions/sports/combat/mma" element={<CombatSports />} />
                  <Route path="/predictions/sports/combat/boxing" element={<CombatSports />} />
                  <Route path="/predictions/sports/combat/eastern" element={<RussianMMA />} />
                  <Route path="/predictions/sports/combat/slap" element={<Slap />} />
                  
                  {/* Combat aliases */}
                  <Route path="/russian-mma" element={<Navigate to="/predictions/sports/combat/eastern" replace />} />
                  <Route path="/eastern" element={<Navigate to="/predictions/sports/combat/eastern" replace />} />
                  <Route path="/slap" element={<Navigate to="/predictions/sports/combat/slap" replace />} />
                  
                  <Route path="/how-betting-works" element={<HowBettingWorks />} />
                  <Route path="/my-slips" element={<MySlips />} />
                  <Route path="/payouts" element={<Payouts />} />
                  {/* AI */}
                  <Route path="/ai" element={<AIHub />} />
                  <Route path="/voice" element={<Voice />} />
                  <Route path="/kokoro" element={<Kokoro />} />
                  
                  {/* Infrastructure */}
                  <Route path="/infra" element={<InfraHub />} />
                  <Route path="/swaps" element={<Swaps />} />
                  <Route path="/vps" element={<VPS />} />
                  <Route path="/phone" element={<Phone />} />
                  <Route path="/esim" element={<Navigate to="/phone" replace />} />
                  
                  {/* Other */}
                  <Route path="/safety" element={<HarmReduction />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/vpn-resources" element={<VpnResources />} />
                  <Route path="/philosophy" element={<Philosophy />} />
                  <Route path="/grapheneos" element={<GrapheneOS />} />
                  <Route path="/cashout" element={<FiatOfframp />} />
                  <Route path="/buy" element={<FiatOnramp />} />
                  <Route path="/api-analytics" element={<ApiAnalytics />} />
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/tor-guide" element={<TorGuide />} />
                  <Route path="/get-started" element={<GetStarted />} />
                  <Route path="/api-docs" element={<ApiDocs />} />
                  
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

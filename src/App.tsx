import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { PrivateKeyAuthProvider } from "./hooks/usePrivateKeyAuth";
import { TokenProvider } from "./hooks/useToken";
import { CreatorAuthProvider } from "./hooks/useCreatorAuth";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { NetworkStatusBanner } from "./components/NetworkStatusBanner";
// Only NotFound is eagerly loaded (tiny, used as fallback)
import NotFound from "./pages/NotFound";

// Lazy loaded pages - including Index and Browse for better initial bundle
const Index = lazy(() => import("./pages/Index"));
const Browse = lazy(() => import("./pages/Browse"));

// Lazy loaded pages (code splitting for better initial bundle size)
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const Sell = lazy(() => import("./pages/Sell"));
const NewListing = lazy(() => import("./pages/NewListing"));
const EditListing = lazy(() => import("./pages/EditListing"));
const Orders = lazy(() => import("./pages/Orders"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Messages = lazy(() => import("./pages/Messages"));
const HarmReduction = lazy(() => import("./pages/HarmReduction"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Swaps = lazy(() => import("./pages/Swaps"));
const VPS = lazy(() => import("./pages/VPS"));
const Phone = lazy(() => import("./pages/Phone"));
const AIHub = lazy(() => import("./pages/AIHub"));
const VpnResources = lazy(() => import("./pages/VpnResources"));
const Philosophy = lazy(() => import("./pages/Philosophy"));
const GrapheneOS = lazy(() => import("./pages/GrapheneOS"));
const FiatOfframp = lazy(() => import("./pages/FiatOfframp"));
const FiatOnramp = lazy(() => import("./pages/FiatOnramp"));
const ApiAnalytics = lazy(() => import("./pages/ApiAnalytics"));
const Voice = lazy(() => import("./pages/Voice"));
const Kokoro = lazy(() => import("./pages/Kokoro"));
const Verify = lazy(() => import("./pages/Verify"));
const Support = lazy(() => import("./pages/Support"));
const TorGuide = lazy(() => import("./pages/TorGuide"));
const HowBettingWorks = lazy(() => import("./pages/HowBettingWorks"));

// Heavy prediction pages (largest bundles - definitely lazy load)
const CryptoPredictions = lazy(() => import("./pages/CryptoPredictions"));
const SportsPredictions = lazy(() => import("./pages/SportsPredictions"));
const EsportsPredictions = lazy(() => import("./pages/EsportsPredictions"));
const CricketPredictions = lazy(() => import("./pages/CricketPredictions"));
const StarcraftPredictions = lazy(() => import("./pages/StarcraftPredictions"));
const CombatSports = lazy(() => import("./pages/CombatSports"));
const Slap = lazy(() => import("./pages/Slap"));
const PredictionsHub = lazy(() => import("./pages/PredictionsHub"));
const MarketDetail = lazy(() => import("./pages/MarketDetail"));

// Other lazy loaded pages
const InfraHub = lazy(() => import("./pages/InfraHub"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const MySlips = lazy(() => import("./pages/MySlips"));
const Payouts = lazy(() => import("./pages/Payouts"));
const Influencer = lazy(() => import("./pages/Influencer"));
const InfluencerDashboard = lazy(() => import("./pages/InfluencerDashboard"));
const PartnerEarnings = lazy(() => import("./pages/PartnerEarnings"));
const FlashMarkets = lazy(() => import("./pages/FlashMarkets"));

// Creator pages
const CreatorRegister = lazy(() => import("./pages/creator/CreatorRegister"));
const CreatorLogin = lazy(() => import("./pages/creator/CreatorLogin"));
const CreatorDashboard = lazy(() => import("./pages/creator/CreatorDashboard"));
const CreatorUpload = lazy(() => import("./pages/creator/CreatorUpload"));
const CreatorSettings = lazy(() => import("./pages/creator/CreatorSettings"));
const CreatorsHub = lazy(() => import("./pages/creator/CreatorsHub"));
const CreatorProfile = lazy(() => import("./pages/creator/CreatorProfile"));
const ContentView = lazy(() => import("./pages/creator/ContentView"));
const ContentSearch = lazy(() => import("./pages/creator/ContentSearch"));
const CreatorTerms = lazy(() => import("./pages/creator/CreatorTerms"));
const CreatorPrivacy = lazy(() => import("./pages/creator/CreatorPrivacy"));
const CreatorContentPolicy = lazy(() => import("./pages/creator/CreatorContentPolicy"));
const Creator2257 = lazy(() => import("./pages/creator/Creator2257"));
const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

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
              <CreatorAuthProvider>
              <Suspense fallback={<PageLoader />}>
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
                  <Route path="/predictions/sports/combat/slap" element={<Slap />} />
                  <Route path="/slap" element={<Navigate to="/predictions/sports/combat/slap" replace />} />
                  
                  <Route path="/how-betting-works" element={<HowBettingWorks />} />
                  <Route path="/market/:id" element={<MarketDetail />} />
                  <Route path="/my-slips" element={<MySlips />} />
                  <Route path="/payouts" element={<Payouts />} />
                  <Route path="/flash" element={<FlashMarkets />} />
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
                  
                  {/* Influencer */}
                  <Route path="/influencer" element={<Influencer />} />
                  <Route path="/influencer/:code" element={<InfluencerDashboard />} />
                  
                  {/* Partner Earnings (private) */}
                  <Route path="/partners/earnings" element={<PartnerEarnings />} />
                  
                  {/* Creators */}
                  <Route path="/creators" element={<CreatorsHub />} />
                  <Route path="/creator/register" element={<CreatorRegister />} />
                  <Route path="/creator/login" element={<CreatorLogin />} />
                  <Route path="/creator/dashboard" element={<CreatorDashboard />} />
                  <Route path="/creator/upload" element={<CreatorUpload />} />
                  <Route path="/creator/settings" element={<CreatorSettings />} />
                  <Route path="/creator/terms" element={<CreatorTerms />} />
                  <Route path="/creator/privacy" element={<CreatorPrivacy />} />
                  <Route path="/creator/content-policy" element={<CreatorContentPolicy />} />
                  <Route path="/creator/2257" element={<Creator2257 />} />
                  <Route path="/creator/:id" element={<CreatorProfile />} />
                  <Route path="/content/:id" element={<ContentView />} />
                  <Route path="/content/search" element={<ContentSearch />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </CreatorAuthProvider>
              </TokenProvider>
            </PrivateKeyAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;

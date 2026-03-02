import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ScoutMatch from "./pages/ScoutMatch";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Picklist from "./pages/Picklist";
import PitScout from "./pages/PitScout";
import NotFound from "./pages/NotFound";

import { initializeSync, EVENT_KEY } from "./lib/storage";
import { initializeTBACache, fetchAllEventMatches } from "./lib/tba";
import { useEffect } from "react";
import { SyncIndicator } from "./components/scouting/SyncIndicator";
import { PwaInstallPrompt } from "./components/pwa/PwaInstallPrompt";
import { ReloadPrompt } from "./components/pwa/ReloadPrompt";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Load cached matches first
    initializeTBACache();

    // Sync entries
    const cleanup = initializeSync();

    // Fetch fresh matches in background if online
    if (navigator.onLine) {
      fetchAllEventMatches(EVENT_KEY()).catch(err => console.warn('Failed to pre-fetch TBA data:', err));
    }

    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SyncIndicator />
        <PwaInstallPrompt />
        <ReloadPrompt />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/scout" element={<ScoutMatch />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/team/:teamNumber" element={<TeamDetail />} />
            <Route path="/picklist" element={<Picklist />} />
            <Route path="/pit-scout" element={<PitScout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

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
import NotFound from "./pages/NotFound";

import { initializeSync } from "./lib/storage";
import { useEffect } from "react";
import { SyncIndicator } from "./components/scouting/SyncIndicator";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const cleanup = initializeSync();
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SyncIndicator />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/scout" element={<ScoutMatch />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/team/:teamNumber" element={<TeamDetail />} />
            <Route path="/picklist" element={<Picklist />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

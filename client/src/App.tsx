import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import HistoryPage from "./pages/HistoryPage";
import Admin from "./pages/Admin";
import { useAuth } from "@/_core/hooks/useAuth";
import { Header } from "./components/Header";

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={() => (user ? <Dashboard /> : <LandingPage />)} />
      <Route path="/history" component={() => (user ? <HistoryPage /> : <LandingPage />)} />
      <Route path="/admin" component={() => (user?.role === 'admin' ? <Admin /> : <NotFound />)} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <div className="min-h-screen bg-background flex flex-col">
            <Toaster />
            <Header />
            <main className="flex-1">
              <Router />
            </main>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

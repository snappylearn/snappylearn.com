import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { GoogleOAuthWrapper } from "@/providers/GoogleOAuthProvider";
import { AuthPage } from "@/components/auth/AuthPage";

import SimpleLanding from "@/pages/simple-landing";
import ModernLanding from "@/pages/modern-landing";
import SocialLanding from "@/pages/social-landing";
import Community from "@/pages/community";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import MyCollections from "@/pages/my-collections";
import Discover from "@/pages/discover";
import Collections from "@/pages/collections";
import CollectionDetail from "@/pages/collection-detail";
import Conversations from "@/pages/conversations";
import Conversation from "@/pages/conversation";
import ArtifactsPage from "@/pages/artifacts";
import AdminDashboard from "@/pages/AdminDashboard";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { MainLayout } from "@/components/layout/MainLayout";

function Router() {
  const { user, loading } = useAuth();

  console.log('Router state:', { user: !!user, loading, showAuth: !user && !loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('Showing landing page');
    return (
      <Switch>
        <Route path="/" component={SocialLanding} />
        <Route path="/auth">{(props) => <AuthPage embedded={false} />}</Route>
        <Route path="/simple" component={SimpleLanding} />
        <Route path="/modern" component={ModernLanding} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  console.log('Showing authenticated routes');
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/my-collections" component={MyCollections} />
      <Route path="/discover" component={Discover} />
      <Route path="/collections" component={Collections} />
      <Route path="/collections/:id" component={CollectionDetail} />
      <Route path="/conversations" component={Conversations} />
      <Route path="/conversations/:id" component={Conversation} />
      <Route path="/artifacts" component={ArtifactsPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthWrapper>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </GoogleOAuthWrapper>
    </QueryClientProvider>
  );
}

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { NavigationProvider } from "./hooks/useNavigation";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Create from "./pages/Create";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Activity from "./pages/Activity";
import Stories from "./pages/Stories";
import Reels from "./pages/Reels";
import Settings from "./pages/Settings";
import AccountSettings from "./pages/AccountSettings";
import NotificationSettings from "./pages/NotificationSettings";
import PrivacySettings from "./pages/PrivacySettings";
import HelpSettings from "./pages/HelpSettings";
import UserProfile from "./pages/UserProfile";
import FollowersList from "./pages/FollowersList";
import SavedPosts from "./pages/SavedPosts";
import EditProfile from "./pages/EditProfile";
import TaggedPosts from "./pages/TaggedPosts";
import LikedPosts from "./pages/LikedPosts";
import CloseFriends from "./pages/CloseFriends";
import Archive from "./pages/Archive";
import QRCode from "./pages/QRCode";
import Chat from "./pages/Chat";
import StoryViewer from "./pages/StoryViewer";
import PostViewer from "./pages/PostViewer";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Layout component to conditionally show bottom navigation
const AppLayout = () => {
  const location = useLocation();
  const showBottomNav = location.pathname !== "/auth" && !location.pathname.startsWith("/messages/chat");

  return (
    <>
      <Routes>
        <Route path="/index" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />
        <Route path="/tagged" element={<ProtectedRoute><TaggedPosts /></ProtectedRoute>} />
        <Route path="/liked" element={<ProtectedRoute><LikedPosts /></ProtectedRoute>} />
        <Route path="/close-friends" element={<ProtectedRoute><CloseFriends /></ProtectedRoute>} />
        <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
        <Route path="/qr-code" element={<ProtectedRoute><QRCode /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
        <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
        <Route path="/stories" element={<ProtectedRoute><Stories /></ProtectedRoute>} />
        <Route path="/stories/:userId" element={<ProtectedRoute><StoryViewer /></ProtectedRoute>} />
        <Route path="/post/:postId" element={<ProtectedRoute><PostViewer /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
        <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
        <Route path="/settings/privacy" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
        <Route path="/settings/help" element={<ProtectedRoute><HelpSettings /></ProtectedRoute>} />
        <Route path="/user/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/followers/:username" element={<ProtectedRoute><FollowersList /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showBottomNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NavigationProvider>
            <AppLayout />
          </NavigationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

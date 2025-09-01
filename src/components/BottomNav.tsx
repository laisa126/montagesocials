import { Home, Search, Plus, Play, User, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, profile, signOut } = useAuth();

  if (!currentUser) return null;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
    { icon: Home, path: "/", label: "Home" },
    { icon: Search, path: "/search", label: "Search" },
    { icon: Plus, path: "/create", label: "Create" },
    { icon: Play, path: "/reels", label: "Reels" },
    { path: "/profile", label: "Profile", isProfile: true }
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            size="icon"
            onClick={() => navigate(item.path)}
            className={`h-10 w-10 rounded-none transition-colors ${
              isActive(item.path) 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.isProfile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="w-6 h-6 cursor-pointer">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                      {(profile?.full_name || profile?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <item.icon size={22} strokeWidth={1.5} />
            )}
          </Button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
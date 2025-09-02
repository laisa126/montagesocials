import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Lock, Bell, HelpCircle, Shield, Settings2, Users, BarChart3, Ban, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllProfiles, banUser as supabaseBanUser, verifyUser as supabaseVerifyUser, Profile } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [notifications, setNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    
    const loadUsers = async () => {
      try {
        const users = await getAllProfiles();
        setAllUsers(users);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentUser, navigate]);

  const handleBanUser = async (userId: string) => {
    try {
      await supabaseBanUser(userId);
      const users = await getAllProfiles();
      setAllUsers(users);
      toast({
        title: "User banned",
        description: "User has been banned successfully.",
      });
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: "Error",
        description: "Failed to ban user.",
        variant: "destructive"
      });
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      await supabaseVerifyUser(userId);
      const users = await getAllProfiles();
      setAllUsers(users);
      toast({
        title: "User verified",
        description: "User has been verified successfully.",
      });
    } catch (error) {
      console.error('Error verifying user:', error);
      toast({
        title: "Error",
        description: "Failed to verify user.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive"
      });
    }
  };

  if (!currentUser || !profile) return null;

  const settingsItems = [
    { icon: User, label: "Account", subtitle: "Privacy, security, password", path: "/settings/account" },
    { icon: Bell, label: "Notifications", subtitle: "Push, email, SMS", hasSwitch: true, path: "/settings/notifications" },
    { icon: Lock, label: "Privacy", subtitle: "Account privacy", hasSwitch: true, path: "/settings/privacy" },
    { icon: HelpCircle, label: "Help", subtitle: "Help center, contact us", path: "/settings/help" },
    { icon: Shield, label: "About", subtitle: "Terms, privacy policy", path: "/settings/help" },
  ];

  const adminItems = [
    { icon: Users, label: "User Management", subtitle: "Manage all users" },
    { icon: BarChart3, label: "Analytics", subtitle: "App statistics" },
    { icon: Settings2, label: "Admin Settings", subtitle: "Admin configuration" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-accent rounded-xl"
            >
              <ArrowLeft size={22} />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card 
          className="border-0 bg-card/50 hover:bg-card/80 cursor-pointer transition-all duration-300 rounded-2xl"
          onClick={() => navigate(`/user/${profile.user_id}`)}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-xl">
                  {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-foreground text-lg">{profile.full_name || profile.username}</h3>
                  {profile.is_verified && <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                  {profile.is_admin && <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-md">ADMIN</span>}
                </div>
                <p className="text-muted-foreground font-medium">@{profile.username}</p>
                <p className="text-sm text-muted-foreground/70 mt-1">View and edit profile</p>
              </div>
              <ChevronRight size={20} className="text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        {/* Settings List */}
        <div className="space-y-2">
          {settingsItems.map((item, index) => (
            <Card 
              key={index} 
              className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                if (item.path) {
                  navigate(item.path);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className="text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    </div>
                  </div>
                  {item.hasSwitch && (
                    <Switch 
                      checked={item.label === "Notifications" ? notifications : privateAccount}
                      onCheckedChange={(checked) => {
                        if (item.label === "Notifications") {
                          setNotifications(checked);
                          navigate("/settings/notifications");
                        } else {
                          setPrivateAccount(checked);
                          navigate("/settings/privacy");
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Panel */}
        {profile?.is_admin && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
            
            <div className="space-y-2">
              {adminItems.map((item, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* User Management */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-4">All Users ({allUsers.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-sm">
                            {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{user.username}</p>
                            {user.is_verified && <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                            {user.is_admin && <span className="px-1 py-0.5 bg-red-500 text-white text-xs rounded">ADMIN</span>}
                            {user.is_banned && <span className="px-1 py-0.5 bg-red-600 text-white text-xs rounded">BANNED</span>}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.full_name}</p>
                        </div>
                      </div>
                      {!user.is_admin && (
                        <div className="flex gap-2">
                          {!user.is_verified && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleVerifyUser(user.user_id)}
                            >
                              Verify
                            </Button>
                          )}
                          {!user.is_banned && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleBanUser(user.user_id)}
                            >
                              <Ban size={14} />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Logout Button */}
        <Button 
          variant="destructive" 
          className="w-full flex items-center gap-2"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default Settings;
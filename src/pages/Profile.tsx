import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Edit, Grid, Bookmark, Heart, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/button-variants";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, getPosts, getFollowerCount, getFollowingCount, type Profile as ProfileType, type Post } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, profile, loading } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "", 
    bio: "",
    avatar_url: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    
    if (profile) {
      setEditForm({
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || ""
      });

      // Get user's posts and counts
      loadUserPosts();
      loadCounts();
    }
  }, [loading, user, profile, navigate]);

  const loadUserPosts = async () => {
    if (!user) return;
    
    try {
      const allPosts = await getPosts();
      const myPosts = allPosts.filter(post => post.user_id === user.id);
      setUserPosts(myPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadCounts = async () => {
    if (!user) return;
    
    try {
      const [followersCountData, followingCountData] = await Promise.all([
        getFollowerCount(user.id),
        getFollowingCount(user.id)
      ]);
      setFollowersCount(followersCountData);
      setFollowingCount(followingCountData);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      await updateProfile(user.id, {
        full_name: editForm.full_name,
        username: editForm.username,
        bio: editForm.bio,
        avatar_url: editForm.avatar_url
      });
      
      setIsEditingProfile(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditForm(prev => ({
          ...prev,
          avatar_url: event.target!.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    try {
      const { signOut } = useAuth();
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-muted h-9 w-9"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
            <h1 className="text-lg font-medium text-foreground">@{profile.username}</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/settings")}
            className="text-foreground hover:bg-muted h-9 w-9"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="19" cy="12" r="1" fill="currentColor"/>
              <circle cx="5" cy="12" r="1" fill="currentColor"/>
            </svg>
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        {/* Profile Info */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-6 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-foreground text-xl font-medium">
                {profile.full_name?.charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 flex justify-around text-center">
              <div>
                <p className="text-xl font-medium text-foreground">{userPosts.length}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <button 
                className="text-center hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/user/${user.id}/followers`)}
              >
                <p className="text-xl font-medium text-foreground">{followersCount}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </button>
              <button 
                className="text-center hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/user/${user.id}/following`)}
              >
                <p className="text-xl font-medium text-foreground">{followingCount}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-sm font-medium text-foreground">{profile.full_name || profile.username}</h2>
            {profile.bio && (
              <p className="text-sm text-foreground mt-1">{profile.bio}</p>
            )}
          </div>


          {/* Edit Profile and Share Profile Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/edit-profile")}
              className="flex-1 bg-muted text-foreground border-border hover:bg-muted/80"
              variant="outline"
            >
              Edit Profile
            </Button>
            <Button
              onClick={() => navigate("/archive")}
              variant="outline"
              size="icon"
              className="flex-shrink-0 border-border"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent border-t border-border h-12">
            <TabsTrigger value="posts" className="flex items-center justify-center border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none">
              <Grid size={20} />
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center justify-center border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none" onClick={() => navigate("/saved")}>
              <Bookmark size={20} />
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center justify-center border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none" onClick={() => navigate("/liked")}>
              <Heart size={20} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {userPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Plus size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Share your first post</h3>
                <p className="text-muted-foreground text-center mb-6 text-sm">
                  When you share photos and videos, they'll appear on your profile.
                </p>
                <Button
                  onClick={() => navigate("/create")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Create Post
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 px-4">
                {userPosts.map(post => (
                  <div key={post.id} className="aspect-square bg-muted overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                     {post.images && post.images.length > 0 ? (
                       <img 
                         src={post.images[0]} 
                         alt="Post"
                         className="w-full h-full object-cover"
                         onClick={() => navigate(`/post/${post.id}`)}
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
                         <p className="text-xs text-center text-muted-foreground p-2 line-clamp-3">
                           {post.content}
                         </p>
                       </div>
                     )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Bookmark className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Save posts for later</h3>
              <p className="text-muted-foreground text-center mb-6">
                Bookmark posts you want to see again.
              </p>
              <Button
                onClick={() => navigate("/saved")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                View Saved Posts
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="liked" className="mt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Posts you've liked</h3>
              <p className="text-muted-foreground text-center mb-6">
                When you tap to like posts, they'll appear here.
              </p>
              <Button
                onClick={() => navigate("/liked")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                View Liked Posts
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
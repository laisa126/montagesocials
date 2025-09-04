import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, MoreHorizontal, Grid, Bookmark, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GradientButton } from "@/components/ui/button-variants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  getProfileById, 
  getPosts, 
  followUser, 
  unfollowUser, 
  getFollowers,
  getFollowing,
  Profile, 
  Post 
} from "@/lib/supabase";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profileUser, setProfileUser] = useState<Profile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const loadUserData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const [profileData, postsData, followersData, followingData] = await Promise.all([
          getProfileById(userId),
          getPosts(),
          getFollowers(userId),
          getFollowing(userId)
        ]);
        
        if (profileData) {
          setProfileUser(profileData);
          
          // Filter posts for this user
          const myPosts = postsData.filter(post => post.user_id === userId);
          setUserPosts(myPosts);
          
          setFollowers(followersData);
          setFollowing(followingData);
          
          // Check if current user is following this profile
          const isCurrentlyFollowing = followersData.some(f => f.follower_id === user.id);
          setIsFollowing(isCurrentlyFollowing);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [userId, user, navigate, toast]);

  const handleFollowToggle = async () => {
    if (!user || !profileUser) return;

    try {
      if (isFollowing) {
        await unfollowUser(profileUser.user_id);
        setIsFollowing(false);
        setFollowers(prev => prev.filter(f => f.follower_id !== user.id));
        toast({
          title: "Unfollowed",
          description: `You unfollowed @${profileUser.username}`,
        });
      } else {
        await followUser(profileUser.user_id);
        setIsFollowing(true);
        setFollowers(prev => [...prev, { follower_id: user.id }]);
        toast({
          title: "Following",
          description: `You are now following @${profileUser.username}`,
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    }
  };

  const handleMessage = () => {
    // Navigate to messages with user parameter
    navigate(`/messages/chat/${profileUser?.user_id}`);
  };

  if (!user || !profile || loading || !profileUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isOwnProfile = user.id === profileUser.user_id;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground hover:text-primary"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">{profileUser.username}</h1>
              {profileUser.is_verified && (
                <Badge variant="secondary" className="bg-primary text-primary-foreground h-5 w-5 p-0 rounded-full flex items-center justify-center">
                  ✓
                </Badge>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-foreground hover:text-primary"
          >
            <MoreHorizontal size={20} />
          </Button>
        </div>
      </header>

      {/* Profile Header - Instagram Style */}
      <div className="text-center py-8 space-y-4">
        {/* Profile Picture */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src={profileUser.avatar_url} className="object-cover" />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-4xl font-bold">
                {(profileUser.full_name || profileUser.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Username and Verification */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-foreground font-inter">{profileUser.username}</h1>
            {profileUser.is_verified && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">✓</span>
              </div>
            )}
          </div>
          {profileUser.full_name && (
            <p className="text-muted-foreground font-medium">{profileUser.full_name}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{userPosts.length}</div>
            <div className="text-sm text-muted-foreground font-medium">Posts</div>
          </div>
          <button 
            className="text-center hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/user/${profileUser.user_id}/followers`)}
          >
            <div className="text-2xl font-bold text-foreground">{followers.length}</div>
            <div className="text-sm text-muted-foreground font-medium">Followers</div>
          </button>
          <button 
            className="text-center hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/user/${profileUser.user_id}/following`)}
          >
            <div className="text-2xl font-bold text-foreground">{following.length}</div>
            <div className="text-sm text-muted-foreground font-medium">Following</div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="px-8 space-y-3">
          {isOwnProfile ? (
            <Button 
              variant="secondary" 
              className="w-full rounded-xl h-12 font-semibold"
              onClick={() => navigate("/profile")}
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={handleFollowToggle}
                className={`flex-1 rounded-xl h-12 font-semibold ${
                  isFollowing 
                    ? 'bg-muted text-foreground hover:bg-muted/80' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1 rounded-xl h-12 font-semibold"
                onClick={handleMessage}
              >
                Message
              </Button>
            </div>
          )}
          
          {profileUser.bio && (
            <p className="text-sm text-foreground text-center px-4 leading-relaxed">
              {profileUser.bio}
            </p>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="border-t border-border">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent border-b-0 h-auto p-0">
            <TabsTrigger 
              value="posts" 
              className="flex items-center justify-center gap-2 py-4 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none bg-transparent"
            >
              <Grid size={20} />
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="flex items-center justify-center gap-2 py-4 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none bg-transparent"
            >
              <Bookmark size={20} />
            </TabsTrigger>
            <TabsTrigger 
              value="liked" 
              className="flex items-center justify-center gap-2 py-4 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none bg-transparent"
            >
              <Heart size={20} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {userPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 border-2 border-foreground rounded-full flex items-center justify-center mb-6">
                  <Grid size={32} className="text-foreground" />
                </div>
                <h3 className="text-xl font-light text-foreground mb-2">No Posts Yet</h3>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 p-1">
                {userPosts.map(post => (
                  <div 
                    key={post.id} 
                    className="aspect-square bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    {post.images && post.images.length > 0 ? (
                      <img 
                        src={post.images[0]} 
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
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

          <TabsContent value="saved" className="mt-0">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 border-2 border-foreground rounded-full flex items-center justify-center mb-6">
                <Bookmark size={32} className="text-foreground" />
              </div>
              <h3 className="text-xl font-light text-foreground mb-2">No Saved Posts</h3>
            </div>
          </TabsContent>

          <TabsContent value="liked" className="mt-0">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 border-2 border-foreground rounded-full flex items-center justify-center mb-6">
                <Heart size={32} className="text-foreground" />
              </div>
              <h3 className="text-xl font-light text-foreground mb-2">No Liked Posts</h3>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { GradientButton } from "@/components/ui/button-variants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  getProfileById, 
  getAllProfiles,
  followUser, 
  unfollowUser,
  getFollowers,
  getFollowing,
  Profile
} from "@/lib/supabase";

const FollowersList = () => {
  const { userId, type } = useParams<{ userId: string; type: "followers" | "following" }>();
  const [profileUser, setProfileUser] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFollowings, setUserFollowings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const loadData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const [profileData, allProfiles] = await Promise.all([
          getProfileById(userId),
          getAllProfiles()
        ]);
        
        if (profileData) {
          setProfileUser(profileData);
          
          let relevantUsers: Profile[] = [];
          
          if (type === "followers") {
            const followersData = await getFollowers(userId);
            const followerIds = followersData.map(f => f.follower_id);
            relevantUsers = allProfiles.filter(p => followerIds.includes(p.user_id));
          } else if (type === "following") {
            const followingData = await getFollowing(userId);
            const followingIds = followingData.map(f => f.following_id);
            relevantUsers = allProfiles.filter(p => followingIds.includes(p.user_id));
          }
          
          setUsers(relevantUsers);
          setFilteredUsers(relevantUsers);
          
          // Get current user's followings
          const myFollowings = await getFollowing(user.id);
          setUserFollowings(myFollowings.map(f => f.following_id));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId, type, user, navigate, toast]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user) return;

    const isFollowing = userFollowings.includes(targetUserId);
    const targetUser = users.find(u => u.user_id === targetUserId);
    
    try {
      if (isFollowing) {
        await unfollowUser(targetUserId);
        setUserFollowings(prev => prev.filter(id => id !== targetUserId));
        toast({
          title: "Unfollowed",
          description: `You unfollowed @${targetUser?.username}`,
        });
      } else {
        await followUser(targetUserId);
        setUserFollowings(prev => [...prev, targetUserId]);
        toast({
          title: "Following",
          description: `You are now following @${targetUser?.username}`,
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

  const isFollowing = (userId: string) => {
    return userFollowings.includes(userId);
  };

  if (!user || !profile || loading || !profileUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const title = type === "followers" ? "Followers" : "Following";

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
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-full border-input bg-muted/50"
          />
        </div>

        {/* Users List */}
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery.trim() ? `No users found for "${searchQuery}"` : `No ${type} yet`}
              </p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <Card key={user.id} className="border border-border hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/user/${user.user_id}`)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                          {(user.full_name || user.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{user.username}</h3>
                          {user.is_verified && (
                            <VerificationBadge size={20} />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.full_name}</p>
                        {user.bio && (
                          <p className="text-xs text-muted-foreground truncate mt-1">{user.bio}</p>
                        )}
                      </div>
                    </button>
                    
                    {user.user_id !== profile?.user_id && (
                      <GradientButton
                        variant={isFollowing(user.user_id) ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => handleFollowToggle(user.user_id)}
                        className="px-4"
                      >
                        {isFollowing(user.user_id) ? "Following" : "Follow"}
                      </GradientButton>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersList;
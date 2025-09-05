import { useState, useEffect } from "react";
import { ArrowLeft, Users, Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getAllProfiles, getFollowing } from "@/lib/supabase";
import { Profile } from "@/lib/supabase";

const CloseFriends = () => {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [closeFriends, setCloseFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [profilesData, followingData] = await Promise.all([
          getAllProfiles(),
          getFollowing(user.id)
        ]);
        
        setAllProfiles(profilesData);
        
        // Get profiles of people we're following
        const followingIds = followingData.map(f => f.following_id);
        const followingProfiles = profilesData.filter(p => followingIds.includes(p.user_id));
        setFollowing(followingProfiles);
        
        // TODO: Load actual close friends from database
        // For now, using localStorage as placeholder
        const savedCloseFriends = localStorage.getItem(`close_friends_${user.id}`);
        if (savedCloseFriends) {
          setCloseFriends(JSON.parse(savedCloseFriends));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load close friends",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, navigate, toast]);

  const toggleCloseFriend = (userId: string) => {
    setCloseFriends(prev => {
      const newCloseFriends = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      // Save to localStorage (in real app, would save to database)
      localStorage.setItem(`close_friends_${user?.id}`, JSON.stringify(newCloseFriends));
      
      const action = newCloseFriends.includes(userId) ? "added to" : "removed from";
      toast({
        title: "Close friends updated",
        description: `User ${action} your close friends list.`,
      });
      
      return newCloseFriends;
    });
  };

  const filteredFollowing = following.filter(profile =>
    profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-muted h-9 w-9"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-lg font-medium text-foreground">Close Friends</h1>
          </div>
          <Button
            onClick={() => navigate("/profile")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            Done
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">Close Friends</h3>
                <p className="text-sm text-muted-foreground">
                  Close friends will see a green ring around your story. Only you can see who's on your close friends list.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends..."
            className="pl-10 border-input"
          />
        </div>

        {/* Close Friends Count */}
        {closeFriends.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {closeFriends.length} close friend{closeFriends.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Friends List */}
        <div className="space-y-2">
          {filteredFollowing.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No friends found</p>
            </div>
          ) : (
            filteredFollowing.map(profile => {
              const isCloseFriend = closeFriends.includes(profile.user_id);
              
              return (
                <Card key={profile.id} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback className="bg-muted text-foreground font-medium">
                            {(profile.full_name || profile.username).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{profile.username}</p>
                          <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => toggleCloseFriend(profile.user_id)}
                        variant={isCloseFriend ? "secondary" : "outline"}
                        size="sm"
                        className={isCloseFriend ? "bg-green-500 text-white hover:bg-green-600" : ""}
                      >
                        {isCloseFriend ? (
                          <>
                            <X size={16} className="mr-1" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus size={16} className="mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CloseFriends;
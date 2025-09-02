import { useState, useEffect } from "react";
import { Search as SearchIcon, Users, Hash, UserPlus, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllProfiles, getPosts, Profile, Post, followUser, unfollowUser, getFollowing } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFollowings, setUserFollowings] = useState<string[]>([]);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    
    const loadData = async () => {
      try {
        const [usersData, postsData, followingData] = await Promise.all([
          getAllProfiles(),
          getPosts(),
          getFollowing(currentUser.id)
        ]);
        setUsers(usersData);
        setPosts(postsData);
        setUserFollowings(followingData.map(f => f.following_id));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const userResults = users.filter(user => 
        user.user_id !== currentUser?.id &&
        (user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.bio?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      const postResults = posts.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setFilteredUsers(userResults);
      setFilteredPosts(postResults);
    } else {
      setFilteredUsers([]);
      setFilteredPosts([]);
    }
  }, [searchQuery, users, posts, currentUser?.id]);

  const getUserById = (userId: string) => {
    return users.find(user => user.user_id === userId);
  };

  const isFollowing = (userId: string) => {
    return userFollowings.includes(userId);
  };

  const handleFollowToggle = async (targetUserId: string) => {
    try {
      if (isFollowing(targetUserId)) {
        await unfollowUser(targetUserId);
        setUserFollowings(prev => prev.filter(id => id !== targetUserId));
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user.",
        });
      } else {
        await followUser(targetUserId);
        setUserFollowings(prev => [...prev, targetUserId]);
        toast({
          title: "Following",
          description: "You are now following this user.",
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status.",
        variant: "destructive"
      });
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-4">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder="Search users and posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 rounded-xl border-0 bg-muted/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        {!searchQuery.trim() ? (
          /* Explore Section */
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Discover People</h2>
              <div className="grid grid-cols-2 gap-4">
                 {users.filter(user => user.user_id !== currentUser?.id).slice(0, 6).map(user => (
                  <Card 
                    key={user.id} 
                    className="border-0 bg-card/50 hover:bg-card/80 transition-all duration-300 cursor-pointer rounded-xl"
                    onClick={() => navigate(`/user/${user.user_id}`)}
                  >
                    <CardContent className="p-5 text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-4">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
                          {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-sm text-foreground mb-1">{user.username}</h3>
                      <p className="text-xs text-muted-foreground mb-4 truncate">{user.full_name}</p>
                      <div className="flex gap-2 justify-center">
                        <Button 
                          size="sm" 
                          variant={isFollowing(user.user_id) ? "secondary" : "default"}
                          className="text-xs px-4 py-2 rounded-xl font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowToggle(user.user_id);
                          }}
                        >
                          {isFollowing(user.user_id) ? "Following" : "Follow"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-xs px-3 py-2 rounded-xl"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/messages/chat/${user.user_id}`);
                          }}
                        >
                          <MessageCircle size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Search Results */
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted rounded-full p-1 mb-6">
              <TabsTrigger value="users" className="flex items-center gap-2 rounded-full">
                <Users size={16} />
                Users ({filteredUsers.length})
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex items-center gap-2 rounded-full">
                <Hash size={16} />
                Posts ({filteredPosts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No users found for "{searchQuery}"</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <Card 
                    key={user.id} 
                    className="border border-border hover:border-primary/20 transition-colors cursor-pointer"
                    onClick={() => navigate(`/user/${user.user_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                            {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{user.username}</h3>
                          <p className="text-sm text-muted-foreground truncate">{user.full_name}</p>
                          {user.bio && (
                            <p className="text-xs text-muted-foreground truncate mt-1">{user.bio}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant={isFollowing(user.user_id) ? "outline" : "default"}
                            className="px-4 py-1 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowToggle(user.user_id);
                            }}
                          >
                            {isFollowing(user.user_id) ? "Following" : "Follow"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="px-2 py-1 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/messages/chat/${user.user_id}`);
                            }}
                          >
                            <MessageCircle size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-3">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-8">
                  <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No posts found for "{searchQuery}"</p>
                </div>
              ) : (
                filteredPosts.map(post => {
                  const postUser = getUserById(post.user_id);
                  if (!postUser) return null;

                  return (
                     <Card 
                       key={post.id} 
                       className="border border-border hover:border-primary/20 transition-colors cursor-pointer"
                       onClick={() => navigate(`/post/${post.id}`)}
                     >
                      <CardContent className="p-4">
                         <div className="flex items-start gap-3">
                           <button 
                             className="hover:opacity-80 transition-opacity"
                             onClick={(e) => {
                               e.stopPropagation();
                               navigate(`/user/${postUser.user_id}`);
                             }}
                           >
                             <Avatar className="w-10 h-10">
                               <AvatarImage src={postUser.avatar_url} />
                               <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold text-sm">
                                 {(postUser.full_name || postUser.username || 'U').charAt(0).toUpperCase()}
                               </AvatarFallback>
                             </Avatar>
                           </button>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                               <button 
                                 className="font-semibold text-sm text-foreground hover:opacity-80 transition-opacity"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   navigate(`/user/${postUser.user_id}`);
                                 }}
                               >
                                 {postUser.username}
                               </button>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>0 likes</span>
                              <span>0 comments</span>
                            </div>
                          </div>
                          {post.images && post.images.length > 0 && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img 
                                src={post.images[0]} 
                                alt="Post preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Search;
import { useState, useEffect } from "react";
import { Search, Hash, TrendingUp, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  getPosts, 
  getHashtags, 
  getAllProfiles,
  Post, 
  Hashtag, 
  Profile 
} from "@/lib/supabase";
import ImageCarousel from "@/components/ImageCarousel";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadExploreData();
  }, []);

  const loadExploreData = async () => {
    try {
      const [postsData, hashtagsData, usersData] = await Promise.all([
        getPosts(),
        getHashtags(20),
        getAllProfiles()
      ]);
      
      // Shuffle posts for explore feed
      const shuffledPosts = [...postsData].sort(() => Math.random() - 0.5);
      setPosts(shuffledPosts);
      setHashtags(hashtagsData);
      setUsers(usersData.slice(0, 10)); // Show top 10 users
    } catch (error) {
      console.error('Error loading explore data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHashtags = hashtags.filter(hashtag =>
    hashtag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-muted-foreground" />
            <div className="flex-1 h-10 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-1">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts, people, hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {searchQuery ? (
        /* Search Results */
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <TrendingUp size={16} />
              Posts
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="flex items-center gap-2">
              <Hash size={16} />
              Hashtags
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center gap-2">
              <User size={16} />
              People
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="p-4">
            <div className="grid grid-cols-3 gap-1">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0]}
                      alt="Post content"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-subtle rounded-lg flex items-center justify-center p-2">
                      <p className="text-foreground text-xs text-center line-clamp-4">
                        {post.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hashtags" className="p-4">
            <div className="space-y-3">
              {filteredHashtags.map((hashtag) => (
                <Card key={hashtag.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                        <Hash size={20} className="text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">#{hashtag.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {hashtag.post_count} {hashtag.post_count === 1 ? 'post' : 'posts'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{hashtag.post_count}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="people" className="p-4">
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <Card 
                  key={user.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/profile`)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                          {user.full_name?.charAt(0)?.toUpperCase() || user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{user.username}</p>
                          {user.is_verified && (
                            <Badge variant="secondary" className="bg-primary text-primary-foreground h-4 w-4 p-0 rounded-full flex items-center justify-center text-xs">
                              ✓
                            </Badge>
                          )}
                        </div>
                        {user.full_name && (
                          <p className="text-sm text-muted-foreground">{user.full_name}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Follow
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        /* Explore Grid */
        <div className="p-4">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Trending</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {hashtags.slice(0, 5).map((hashtag) => (
                <Badge
                  key={hashtag.id}
                  variant="outline"
                  className="flex-shrink-0 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                >
                  #{hashtag.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="aspect-square cursor-pointer hover:opacity-80 transition-opacity relative group"
              >
                {post.video_url ? (
                  <div className="relative w-full h-full">
                    <video
                      src={post.video_url}
                      className="w-full h-full object-cover rounded-lg"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-lg" />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        Reel
                      </Badge>
                    </div>
                  </div>
                ) : post.images && post.images.length > 0 ? (
                  <>
                    <img
                      src={post.images[0]}
                      alt="Post content"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {post.images.length > 1 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          +{post.images.length - 1}
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-subtle rounded-lg flex items-center justify-center p-2">
                    <p className="text-foreground text-xs text-center line-clamp-4">
                      {post.content}
                    </p>
                  </div>
                )}
                
                {/* Hover overlay with stats */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <p className="text-sm font-semibold">
                      {post.post_likes?.length || 0} likes
                    </p>
                    <p className="text-xs">
                      {post.comments?.length || 0} comments
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
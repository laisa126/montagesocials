import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  PlusSquare,
  Film,
  User,
  Heart,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Post {
  id: number;
  username: string;
  avatar: string;
  is_verified: boolean;
  image: string;
  likes: number;
  caption: string;
  comments: { id: number; user: string; text: string }[];
}

const samplePosts: Post[] = [
  {
    id: 1,
    username: "john_doe",
    avatar: "/avatars/john.png",
    is_verified: true,
    image: "/posts/post1.jpg",
    likes: 245,
    caption: "Beautiful day at the beach 🌊",
    comments: [
      { id: 1, user: "sarah", text: "Wow looks amazing!" },
      { id: 2, user: "alex", text: "Take me there!" },
    ],
  },
  {
    id: 2,
    username: "sarah_lee",
    avatar: "/avatars/sarah.png",
    is_verified: false,
    image: "/posts/post2.jpg",
    likes: 120,
    caption: "Coffee vibes ☕✨",
    comments: [{ id: 1, user: "mike", text: "I need that coffee now" }],
  },
];

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const [loading, setLoading] = useState(false);
  const [commentingPost, setCommentingPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const navigate = useNavigate();

  const refreshFeed = () => {
    setLoading(true);
    setTimeout(() => {
      setPosts((prev) => [...prev, ...samplePosts]); // simulate new posts
      setLoading(false);
    }, 1500);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !commentingPost) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === commentingPost.id
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: Date.now(), user: "you", text: newComment },
              ],
            }
          : p
      )
    );
    setNewComment("");
    setCommentingPost(null);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 🔝 Top bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <h1 className="font-bold text-lg">Montage</h1>
        <div className="flex space-x-4">
          <Heart className="w-6 h-6" />
          <MessageCircle className="w-6 h-6" />
        </div>
      </div>

      {/* 🔄 Refresh */}
      <div className="flex justify-center p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshFeed}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Refreshing..." : "Tap to refresh"}
        </Button>
      </div>

      {/* 📰 Feed */}
      <div className="flex-1 overflow-y-auto">
        {posts.map((post) => (
          <div key={post.id} className="border-b pb-4 mb-4">
            {/* Post header */}
            <div className="flex items-center p-2">
              <img
                src={post.avatar}
                alt={post.username}
                className="w-10 h-10 rounded-full"
              />
              <div className="ml-2 flex items-center font-semibold">
                {post.username}
                {post.is_verified && (
                  <span className="ml-1 inline-flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                    >
                      <defs>
                        <linearGradient
                          id="metaVerifiedGradient"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#48a6ff" />
                          <stop offset="100%" stopColor="#0064e0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M12 2.25l2.05 1.15 2.3-.45 1.2 2.05 2.3.7.15 2.35 1.7 1.6-1 2.15.5 2.3-2.05 1.1-.7 2.3-2.35.15-1.6 1.7-2.15-1-2.3.5-1.1-2.05-2.3-.7-.15-2.35-1.7-1.6 1-2.15-.5-2.3 2.05-1.1.7-2.3 2.35-.15L12 2.25z"
                        fill="url(#metaVerifiedGradient)"
                      />
                      <path
                        d="M9.5 12.2l1.8 1.8 3.2-3.6"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {/* Post image */}
            <img
              src={post.image}
              alt="post"
              className="w-full h-80 object-cover"
            />

            {/* Actions */}
            <div className="flex space-x-4 px-2 py-2">
              <Heart className="w-6 h-6" />
              <MessageCircle
                className="w-6 h-6"
                onClick={() => setCommentingPost(post)}
              />
            </div>

            {/* Likes + Caption */}
            <div className="px-2">
              <p className="font-semibold">{post.likes} likes</p>
              <p>
                <span className="font-semibold">{post.username}</span>{" "}
                {post.caption}
              </p>
              <button
                className="text-sm text-gray-500"
                onClick={() => setCommentingPost(post)}
              >
                View all {post.comments.length} comments
              </button>
            </div>
          </div>
        ))}

        {/* End of feed */}
        <div className="text-center text-gray-500 py-4">
          🎉 You’re all caught up!
        </div>

        {/* People you may know */}
        <div className="p-4 border-t">
          <h2 className="font-semibold mb-2">People you may know</h2>
          <div className="flex space-x-4 overflow-x-auto">
            {["alex", "mike", "sophia"].map((user) => (
              <div
                key={user}
                className="flex flex-col items-center w-20 text-center"
              >
                <img
                  src={`/avatars/${user}.png`}
                  className="w-16 h-16 rounded-full"
                />
                <p className="text-sm">{user}</p>
                <Button size="sm" className="mt-1">
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 💬 Comment modal */}
      {commentingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end">
          <div className="bg-white w-full p-4 rounded-t-2xl">
            <h2 className="font-semibold mb-2">Comments</h2>
            <div className="max-h-60 overflow-y-auto">
              {commentingPost.comments.map((c) => (
                <p key={c.id}>
                  <span className="font-semibold">{c.user}:</span> {c.text}
                </p>
              ))}
            </div>
            <div className="flex mt-2">
              <input
                className="flex-1 border rounded px-2"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button className="ml-2" onClick={handleAddComment}>
                Post
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 Bottom Tabs */}
      <div className="flex justify-around items-center border-t py-2 bg-white">
        <Home className="w-6 h-6" />
        <Search className="w-6 h-6" />
        <PlusSquare className="w-6 h-6" />
        <Film className="w-6 h-6" />
        <User className="w-6 h-6" />
      </div>
    </div>
  );
  }        setProfiles(profilesData);
        setStories(storiesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load feed data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, navigate, toast]);

  const getProfileById = (userId: string) => {
    return profiles.find(profile => profile.user_id === userId);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const isLiked = post.post_likes?.some(like => like.user_id === user.id);
      
      if (isLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
      
      // Refresh posts
      const updatedPosts = await getPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  if (!user || !profile || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const usersWithStories = profiles.filter(p => 
    stories.some(story => story.user_id === p.user_id && new Date(story.expires_at) > new Date())
  );

  const userStories = stories.filter(story => 
    story.user_id === user.id && new Date(story.expires_at) > new Date()
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">M</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Montage
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/create")}
              className="text-foreground hover:bg-muted h-10 w-10"
            >
              <Plus size={22} strokeWidth={2} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/messages")}
              className="text-foreground hover:bg-muted h-10 w-10"
            >
              <Send size={22} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </header>

      {/* Stories Row */}
      <div className="border-b border-border py-3">
        <div className="flex items-center gap-4 px-4 overflow-x-auto scrollbar-hide">
          {/* Your Story */}
          <button 
            className="flex flex-col items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            onClick={() => navigate("/stories")}
          >
            <div className="relative">
              {userStories.length > 0 ? (
                <div className="p-0.5 bg-primary rounded-full">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-background">
                    <img 
                      src={profile.avatar_url || '/placeholder.svg'} 
                      alt={profile.full_name || 'Your story'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-muted border border-border">
                    <img 
                      src={profile.avatar_url || '/placeholder.svg'} 
                      alt={profile.full_name || 'Your story'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                    <Plus size={12} className="text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-medium max-w-[3.5rem] truncate">
              {userStories.length > 0 ? profile.username : "Your story"}
            </span>
          </button>

        {/* Other Users' Stories */}
          {usersWithStories
            .filter(userProfile => userProfile.user_id !== user.id)
            .map(userProfile => {
              const userStoriesForProfile = stories.filter(story => 
                story.user_id === userProfile.user_id && new Date(story.expires_at) > new Date()
              );
              
              return (
                <button
                  key={userProfile.user_id} 
                  className="flex flex-col items-center gap-2 flex-shrink-0 hover:opacity-80 transition-all duration-200 hover:scale-105"
                  onClick={() => navigate(`/stories/${userProfile.user_id}`)}
                >
                  <div className="p-0.5 bg-gradient-story rounded-full animate-pulse">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-background">
                      <img 
                        src={userProfile.avatar_url || '/placeholder.svg'} 
                        alt={userProfile.full_name || userProfile.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium truncate max-w-[3.5rem]">
                    {userProfile.username}
                  </span>
                </button>
              );
            })
          }
        </div>
      </div>

      {/* Posts Feed */}
      <div className="pb-20">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Plus size={28} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Welcome to Montage!</h2>
            <p className="text-muted-foreground text-center mb-6 text-sm">
              Start sharing your moments. Create your first post to get started.
            </p>
            <Button 
              onClick={() => navigate("/create")}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Create Your First Post
            </Button>
          </div>
        ) : (
          posts.map(post => {
            const postProfile = getProfileById(post.user_id);
            if (!postProfile) return null;

            const isLiked = post.post_likes?.some(like => like.user_id === user.id);
            const likesCount = post.post_likes?.length || 0;

            return (
              <Card key={post.id} className="border-0 rounded-none border-b border-border shadow-none">
                <CardContent className="p-0">
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-4">
                    <button 
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/user/${postProfile.user_id}`)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={postProfile.avatar_url} />
                        <AvatarFallback className="bg-muted text-foreground font-medium text-xs">
                          {(postProfile.full_name || postProfile.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{postProfile.username}</p>
                          {postProfile.is_verified && (
                            <div className="w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-foreground text-[10px]">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</p>
                      </div>
                    </button>
                  </div>

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div
                      className="aspect-square bg-muted cursor-pointer" 
                      onDoubleClick={() => handleLike(post.id)}
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      <img 
                        src={post.images[0]} 
                        alt="Post content"
                        className="w-full object-contain max-h-[600px]"
                      />
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleLike(post.id)}
                          className={`h-8 w-8 hover:bg-transparent ${
                            isLiked
                              ? 'text-red-500' 
                              : 'text-foreground hover:text-red-500'
                          }`}
                        >
                          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={1.5} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-foreground hover:text-foreground hover:bg-transparent"
                          onClick={() => navigate(`/post/${post.id}`)}
                        >
                          <MessageCircle size={20} strokeWidth={1.5} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-foreground hover:bg-transparent">
                          <Send size={20} strokeWidth={1.5} />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-foreground hover:bg-transparent">
                        <Bookmark size={20} strokeWidth={1.5} />
                      </Button>
                    </div>

                    {/* Likes */}
                    {likesCount > 0 && (
                      <p className="font-medium text-sm text-foreground mb-1">
                        {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                      </p>
                    )}

                    {/* Post Content */}
                    <div className="text-sm text-foreground mb-1">
                      <span className="font-medium">{postProfile.username}</span> {post.content}
                    </div>

                    {/* Comments */}
                    {post.comments && post.comments.length > 0 && (
                      <button 
                        className="text-sm text-muted-foreground hover:opacity-80 transition-opacity"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        View all {post.comments.length} comments
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Home;

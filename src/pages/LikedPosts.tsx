import { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getPosts, getAllProfiles } from "@/lib/supabase";
import { Profile, Post } from "@/lib/supabase";

const LikedPosts = () => {
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const loadLikedPosts = async () => {
      try {
        setLoading(true);
        const [postsData, profilesData] = await Promise.all([
          getPosts(),
          getAllProfiles()
        ]);
        
        // Filter posts that the user has liked
        const liked = postsData.filter(post => 
          post.post_likes?.some(like => like.user_id === user.id)
        );
        
        // Sort by most recently liked (approximate using post creation date)
        liked.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setLikedPosts(liked);
        setProfiles(profilesData);
      } catch (error) {
        console.error('Error loading liked posts:', error);
        toast({
          title: "Error",
          description: "Failed to load liked posts",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadLikedPosts();
  }, [user, navigate, toast]);

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
        <div className="flex items-center gap-3 px-4 h-14">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground hover:bg-muted h-9 w-9"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-medium text-foreground">Liked Posts</h1>
        </div>
      </header>

      <div className="pb-20">
        {likedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Heart size={28} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No liked posts yet</h2>
            <p className="text-muted-foreground text-center text-sm">
              Posts you like will appear here. Start exploring and double-tap posts you love.
            </p>
          </div>
        ) : (
          <>
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                {likedPosts.length} liked post{likedPosts.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              {likedPosts.map(post => (
                <button
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="aspect-square bg-muted hover:opacity-80 transition-opacity relative group"
                >
                  {post.images && post.images.length > 0 ? (
                    <>
                      <img 
                        src={post.images[0]} 
                        alt="Liked post"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                        <Heart size={14} className="text-red-500 fill-red-500" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted relative">
                      <p className="text-xs text-muted-foreground text-center p-2">
                        {post.content.substring(0, 50)}...
                      </p>
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                        <Heart size={14} className="text-red-500 fill-red-500" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LikedPosts;
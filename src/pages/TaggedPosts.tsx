import { useState, useEffect } from "react";
import { ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getPosts, getAllProfiles } from "@/lib/supabase";
import { Profile, Post } from "@/lib/supabase";

const TaggedPosts = () => {
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);
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
    
    const loadTaggedPosts = async () => {
      try {
        setLoading(true);
        const [postsData, profilesData] = await Promise.all([
          getPosts(),
          getAllProfiles()
        ]);
        
        // Filter posts where user is tagged
        const tagged = postsData.filter(post => 
          post.user_tags?.some(tag => tag.tagged_user_id === user.id)
        );
        
        setTaggedPosts(tagged);
        setProfiles(profilesData);
      } catch (error) {
        console.error('Error loading tagged posts:', error);
        toast({
          title: "Error",
          description: "Failed to load tagged posts",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadTaggedPosts();
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
          <h1 className="text-lg font-medium text-foreground">Tagged Posts</h1>
        </div>
      </header>

      <div className="pb-20">
        {taggedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Tag size={28} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No tagged posts yet</h2>
            <p className="text-muted-foreground text-center text-sm">
              When someone tags you in a photo or video, it'll appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                {taggedPosts.length} post{taggedPosts.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              {taggedPosts.map(post => (
                <button
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="aspect-square bg-muted hover:opacity-80 transition-opacity relative group"
                >
                  {post.images && post.images.length > 0 ? (
                    <>
                      <img 
                        src={post.images[0]} 
                        alt="Tagged post"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                        <Tag size={14} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <p className="text-xs text-muted-foreground text-center p-2">
                        {post.content.substring(0, 50)}...
                      </p>
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

export default TaggedPosts;
import { useState, useEffect } from "react";
import { ArrowLeft, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getSavedPosts, getAllProfiles } from "@/lib/supabase";
import { Profile, Post } from "@/lib/supabase";

const SavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
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
    
    const loadSavedPosts = async () => {
      try {
        setLoading(true);
        const [savedData, profilesData] = await Promise.all([
          getSavedPosts(),
          getAllProfiles()
        ]);
        
        setSavedPosts(savedData);
        setProfiles(profilesData);
      } catch (error) {
        console.error('Error loading saved posts:', error);
        toast({
          title: "Error",
          description: "Failed to load saved posts",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadSavedPosts();
  }, [user, navigate, toast]);

  const getProfileById = (userId: string) => {
    return profiles.find(profile => profile.user_id === userId);
  };

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
          <h1 className="text-lg font-medium text-foreground">Saved Posts</h1>
        </div>
      </header>

      <div className="pb-20">
        {savedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Bookmark size={28} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No saved posts yet</h2>
            <p className="text-muted-foreground text-center text-sm">
              Posts you save will appear here. Tap the bookmark icon on any post to save it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {savedPosts.map(post => {
              const postProfile = getProfileById(post.user_id);
              
              return (
                <button
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="aspect-square bg-muted hover:opacity-80 transition-opacity"
                >
                  {post.images && post.images.length > 0 ? (
                    <img 
                      src={post.images[0]} 
                      alt="Saved post"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <p className="text-xs text-muted-foreground text-center p-2">
                        {post.content.substring(0, 50)}...
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPosts;
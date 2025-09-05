import { useState, useEffect } from "react";
import { ArrowLeft, Archive as ArchiveIcon, MoreHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getPosts } from "@/lib/supabase";
import { Post } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Archive = () => {
  const [archivedPosts, setArchivedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const loadArchivedPosts = async () => {
      try {
        setLoading(true);
        
        // TODO: In a real app, you'd have an 'archived' field in the posts table
        // For now, we'll use localStorage to simulate archived posts
        const archivedIds = JSON.parse(localStorage.getItem(`archived_posts_${user.id}`) || '[]');
        
        if (archivedIds.length > 0) {
          const allPosts = await getPosts();
          const archived = allPosts.filter(post => 
            post.user_id === user.id && archivedIds.includes(post.id)
          );
          setArchivedPosts(archived);
        }
      } catch (error) {
        console.error('Error loading archived posts:', error);
        toast({
          title: "Error",
          description: "Failed to load archived posts",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadArchivedPosts();
  }, [user, navigate, toast]);

  const unarchivePost = (postId: string) => {
    if (!user) return;
    
    const archivedIds = JSON.parse(localStorage.getItem(`archived_posts_${user.id}`) || '[]');
    const newArchivedIds = archivedIds.filter((id: string) => id !== postId);
    localStorage.setItem(`archived_posts_${user.id}`, JSON.stringify(newArchivedIds));
    
    setArchivedPosts(prev => prev.filter(post => post.id !== postId));
    
    toast({
      title: "Post unarchived",
      description: "Post moved back to your profile.",
    });
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
          <h1 className="text-lg font-medium text-foreground">Archive</h1>
        </div>
      </header>

      <div className="pb-20">
        {archivedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <ArchiveIcon size={28} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Archive</h2>
            <p className="text-muted-foreground text-center text-sm max-w-sm">
              Only you can see posts you've archived. You can unarchive them to add them back to your profile anytime.
            </p>
          </div>
        ) : (
          <>
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                {archivedPosts.length} archived post{archivedPosts.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              {archivedPosts.map(post => (
                <div key={post.id} className="aspect-square bg-muted relative group">
                  {post.images && post.images.length > 0 ? (
                    <img 
                      src={post.images[0]} 
                      alt="Archived post"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <p className="text-xs text-muted-foreground text-center p-2">
                        {post.content.substring(0, 50)}...
                      </p>
                    </div>
                  )}
                  
                  {/* Hover overlay with options */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/post/${post.id}`)}
                        className="text-white hover:bg-white/20"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                          >
                            <MoreHorizontal size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          <DropdownMenuItem onClick={() => unarchivePost(post.id)}>
                            <RotateCcw size={16} className="mr-2" />
                            Unarchive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Archive;
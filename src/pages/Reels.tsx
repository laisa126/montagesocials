import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getPosts, likePost, unlikePost, getAllProfiles, Post, Profile } from "@/lib/supabase";

const Reels = () => {
  const [reels, setReels] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    
    const loadReels = async () => {
      try {
        const [postsData, profilesData] = await Promise.all([
          getPosts(),
          getAllProfiles()
        ]);
        
        // Filter for video posts or reels
        const reelPosts = postsData.filter(post => post.is_reel || post.video_url);
        setReels(reelPosts);
        setProfiles(profilesData);
      } catch (error) {
        console.error('Error loading reels:', error);
        toast({
          title: "Error",
          description: "Failed to load reels",
          variant: "destructive"
        });
      }
    };
    
    loadReels();
  }, [currentUser, navigate, toast]);

  const getUserById = (userId: string) => {
    return profiles.find(profile => profile.user_id === userId);
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      const post = reels.find(p => p.id === postId);
      if (!post) return;
      
      const isLiked = post.post_likes?.some(like => like.user_id === currentUser.id);
      
      if (isLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
      
      // Refresh reels
      const updatedPosts = await getPosts();
      const reelPosts = updatedPosts.filter(post => post.is_reel || post.video_url);
      setReels(reelPosts);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Reels Feed - Full screen vertical scroll */}
      <div className="h-screen overflow-y-auto snap-y snap-mandatory">
        {reels.length === 0 ? (
          <div className="h-screen flex flex-col items-center justify-center px-4 snap-start">
            <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-6 shadow-glow">
              <Heart size={32} className="text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Reels Yet!</h2>
            <p className="text-white/70 text-center mb-6">
              Start creating video content to see reels here.
            </p>
            <Button 
              onClick={() => navigate("/create")}
              className="bg-gradient-primary text-primary-foreground px-8 py-3 rounded-full font-medium shadow-glow hover:shadow-lg transition-all duration-300"
            >
              Create Your First Reel
            </Button>
          </div>
        ) : (
          reels.map((reel, index) => {
            const reelUser = getUserById(reel.user_id);
            if (!reelUser) return null;

            return (
              <div key={reel.id} className="relative h-screen snap-start flex flex-col">
                {/* Reel Header */}
                <div className="absolute top-16 left-4 right-4 z-20 flex items-center justify-between">
                  <h1 className="text-white text-lg font-semibold">Reels</h1>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20 h-10 w-10"
                  >
                    <MoreHorizontal size={20} />
                  </Button>
                </div>

                {/* Reel Content */}
                <div 
                  className="relative flex-1 bg-black cursor-pointer" 
                  onDoubleClick={() => handleLike(reel.id)}
                >
                  {reel.images && reel.images.length > 0 ? (
                    <img 
                      src={reel.images[0]} 
                      alt="Reel content"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-subtle flex items-center justify-center">
                      <p className="text-white text-xl text-center p-8">
                        {reel.content}
                      </p>
                    </div>
                  )}

                  {/* User Info Bottom Left */}
                  <div className="absolute bottom-20 left-4 right-20 text-white z-10">
                    <button 
                      className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/user/${reelUser.user_id}`)}
                    >
                      <Avatar className="w-10 h-10 ring-2 ring-white/30">
                        <AvatarImage src={reelUser.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold text-sm">
                          {(reelUser.full_name || reelUser.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-semibold text-white text-sm">{reelUser.username}</p>
                        {reelUser.is_verified && (
                          <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center ml-1">
                            <span className="text-primary-foreground text-[10px]">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                    <p className="text-white text-sm opacity-90 mb-2">{reel.content}</p>
                    <p className="text-white/70 text-xs">{reel.post_likes?.length || 0} likes</p>
                  </div>

                  {/* Actions Right Side */}
                  <div className="absolute bottom-20 right-4 flex flex-col gap-6 z-10">
                    <div className="flex flex-col items-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleLike(reel.id)}
                        className={`h-12 w-12 rounded-full transition-all duration-200 ${
                          reel.post_likes?.some(like => like.user_id === currentUser.id)
                            ? 'text-red-500 scale-110' 
                            : 'text-white hover:text-red-500 hover:scale-105'
                        }`}
                      >
                        <Heart 
                          size={28} 
                          fill={reel.post_likes?.some(like => like.user_id === currentUser.id) ? 'currentColor' : 'none'}
                          className="drop-shadow-lg"
                        />
                      </Button>
                      <p className="text-white text-xs mt-1 font-medium">
                        {reel.post_likes?.length || 0}
                      </p>
                    </div>

                    <div className="flex flex-col items-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 text-white hover:text-primary hover:scale-105 transition-all duration-200 rounded-full"
                        onClick={() => navigate(`/post/${reel.id}`)}
                      >
                        <MessageCircle size={28} className="drop-shadow-lg" />
                      </Button>
                      <p className="text-white text-xs mt-1 font-medium">
                        {reel.comments?.length || 0}
                      </p>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-12 w-12 text-white hover:text-primary hover:scale-105 transition-all duration-200 rounded-full"
                    >
                      <Send size={28} className="drop-shadow-lg" />
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-12 w-12 text-white hover:text-primary hover:scale-105 transition-all duration-200 rounded-full"
                    >
                      <Bookmark size={28} className="drop-shadow-lg" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Reels;
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X, Heart, Send, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { Progress } from "@/components/ui/progress";
import { 
  getCurrentUser, 
  getStories, 
  getUserById, 
  viewStory,
  toggleStoryLike,
  addStoryReply,
  Story, 
  User 
} from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const StoryViewer = () => {
  const { userId, storyIndex } = useParams<{ userId: string; storyIndex: string }>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [storyUser, setStoryUser] = useState<User | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    
    setCurrentUser(user);
    
    if (userId) {
      const allStories = getStories();
      const userStories = allStories.filter(story => story.userId === userId);
      setStories(userStories);
      
      const index = storyIndex ? parseInt(storyIndex) : 0;
      if (userStories[index]) {
        setCurrentStoryIndex(index);
        setCurrentStory(userStories[index]);
        setStoryUser(getUserById(userId));
        
        // Add view
        viewStory(userStories[index].id, user.id);
      }
    }
  }, [userId, storyIndex, navigate]);

  useEffect(() => {
    if (!currentStory || isPaused) return;

    const duration = 5000; // 5 seconds per story
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentStory, isPaused]);

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setCurrentStory(stories[nextIndex]);
      setProgress(0);
      
      if (currentUser) {
        viewStory(stories[nextIndex].id, currentUser.id);
      }
    } else {
      navigate("/stories");
    }
  };

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(prevIndex);
      setCurrentStory(stories[prevIndex]);
      setProgress(0);
    }
  };

  const handleLike = () => {
    if (!currentUser || !currentStory) return;
    
    toggleStoryLike(currentStory.id, currentUser.id);
    
    // Update local state
    const updatedStory = { ...currentStory };
    if (!updatedStory.likes) updatedStory.likes = [];
    
    if (updatedStory.likes.includes(currentUser.id)) {
      updatedStory.likes = updatedStory.likes.filter(id => id !== currentUser.id);
    } else {
      updatedStory.likes.push(currentUser.id);
    }
    
    setCurrentStory(updatedStory);
  };

  const handleReply = () => {
    if (!replyText.trim() || !currentUser || !currentStory) return;
    
    addStoryReply(currentStory.id, currentUser.id, replyText.trim());
    setReplyText("");
    setShowReplyInput(false);
    
    toast({
      title: "Reply sent",
      description: "Your reply has been sent as a message.",
    });
  };

  const isLiked = currentStory?.likes?.includes(currentUser?.id || "") || false;

  if (!currentUser || !currentStory || !storyUser) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white relative z-10">
        <div className="flex items-center gap-3 flex-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/stories")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft size={20} />
          </Button>
          
          {/* Progress bars */}
          <div className="flex-1 flex gap-1 mx-4">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ 
                    width: index < currentStoryIndex ? '100%' : 
                           index === currentStoryIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/stories")}
          className="text-white hover:bg-white/20"
        >
          <X size={20} />
        </Button>
      </div>

      {/* Story header info */}
      <div className="flex items-center gap-3 px-4 pb-4 text-white relative z-10">
        <button
          onClick={() => navigate(`/user/${storyUser.id}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="w-10 h-10 ring-2 ring-white/50">
            <AvatarImage src={storyUser.avatar} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
              {storyUser.fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{storyUser.username}</p>
              {storyUser.isVerified && (
                <VerificationBadge size={20} />
              )}
            </div>
            <p className="text-sm text-white/70">
              {new Date(currentStory.createdAt).toLocaleDateString()}
            </p>
          </div>
        </button>
      </div>

      {/* Story content */}
      <div 
        className="flex-1 relative cursor-pointer"
        onClick={() => setIsPaused(!isPaused)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const screenWidth = window.innerWidth;
          if (touch.clientX < screenWidth / 2) {
            handlePreviousStory();
          } else {
            handleNextStory();
          }
        }}
      >
        {currentStory.image ? (
          <div className="relative w-full h-full">
            <img 
              src={currentStory.image}
              alt="Story"
              className="w-full h-full object-contain"
            />
            {currentStory.textOverlay && (
              <div 
                className="absolute inset-0 flex items-center justify-center p-8"
                style={{ color: currentStory.textColor || "#ffffff" }}
              >
                <p 
                  className="text-3xl font-bold text-center break-words max-w-full"
                  style={{ 
                    textShadow: (currentStory.textColor || "#ffffff") === "#ffffff" ? "2px 2px 4px rgba(0,0,0,0.8)" : "2px 2px 4px rgba(255,255,255,0.8)",
                    wordWrap: "break-word"
                  }}
                >
                  {currentStory.textOverlay}
                </p>
              </div>
            )}
          </div>
        ) : currentStory.video ? (
          <div className="relative w-full h-full">
            <video 
              src={currentStory.video}
              className="w-full h-full object-contain"
              autoPlay
              muted={isMuted}
              loop
            />
            {currentStory.textOverlay && (
              <div 
                className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none"
                style={{ color: currentStory.textColor || "#ffffff" }}
              >
                <p 
                  className="text-3xl font-bold text-center break-words max-w-full"
                  style={{ 
                    textShadow: (currentStory.textColor || "#ffffff") === "#ffffff" ? "2px 2px 4px rgba(0,0,0,0.8)" : "2px 2px 4px rgba(255,255,255,0.8)",
                    wordWrap: "break-word"
                  }}
                >
                  {currentStory.textOverlay}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
            <p className="text-white text-2xl text-center p-8 max-w-md">
              {currentStory.content || currentStory.textOverlay}
            </p>
          </div>
        )}
        
        {/* Content overlay */}
        {currentStory.content && (currentStory.image || currentStory.video) && (
          <div className="absolute bottom-20 left-4 right-4">
            <p className="text-white text-lg shadow-lg">
              {currentStory.content}
            </p>
          </div>
        )}

        {/* Pause indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
              <Pause className="text-white" size={24} />
            </div>
          </div>
        )}
      </div>

      {/* Story actions */}
      <div className="p-4 text-white relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={`text-white hover:bg-white/20 ${isLiked ? 'text-red-500' : ''}`}
          >
            <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="text-white hover:bg-white/20"
          >
            <Send size={24} />
          </Button>
          
          {currentStory.video && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </Button>
          )}
          
          <div className="flex-1 text-right">
            <p className="text-sm text-white/70">
              {currentStory.views?.length || 0} views • {currentStory.likes?.length || 0} likes
            </p>
          </div>
        </div>

        {/* Reply input */}
        {showReplyInput && (
          <div className="flex items-center gap-3 bg-white/10 rounded-full p-2 backdrop-blur-sm">
            <Input
              type="text"
              placeholder="Reply to story..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-transparent border-none text-white placeholder:text-white/50 focus:ring-0"
              onKeyPress={(e) => e.key === 'Enter' && handleReply()}
            />
            <Button
              onClick={handleReply}
              disabled={!replyText.trim()}
              className="bg-primary text-primary-foreground rounded-full w-10 h-10 p-0"
            >
              <Send size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
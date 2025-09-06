import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getCurrentUser, 
  getPosts, 
  getUserById, 
  togglePostLike,
  addPostComment,
  Post, 
  User 
} from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const PostViewer = () => {
  const { postId } = useParams<{ postId: string }>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [postUser, setPostUser] = useState<User | null>(null);
  const [commentText, setCommentText] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    
    setCurrentUser(user);
    
    if (postId) {
      const posts = getPosts();
      const foundPost = posts.find(p => p.id === postId);
      if (foundPost) {
        setPost(foundPost);
        setPostUser(getUserById(foundPost.userId));
      }
    }
  }, [postId, navigate]);

  const handleLike = () => {
    if (!currentUser || !post) return;
    
    togglePostLike(post.id, currentUser.id);
    
    // Update local state
    const updatedPost = { ...post };
    if (updatedPost.likes.includes(currentUser.id)) {
      updatedPost.likes = updatedPost.likes.filter(id => id !== currentUser.id);
    } else {
      updatedPost.likes.push(currentUser.id);
    }
    
    setPost(updatedPost);
  };

  const handleComment = () => {
    if (!commentText.trim() || !currentUser || !post) return;
    
    addPostComment(post.id, currentUser.id, commentText.trim());
    
    // Update local state
    const newComment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      content: commentText.trim(),
      createdAt: new Date().toISOString()
    };
    
    setPost(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : null);
    setCommentText("");
    
    toast({
      title: "Comment added",
      description: "Your comment has been posted.",
    });
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

  const isLiked = post?.likes?.includes(currentUser?.id || "") || false;

  if (!currentUser || !post || !postUser) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground hover:text-primary"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Post</h1>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="text-foreground hover:text-primary"
        >
          <X size={20} />
        </Button>
      </header>

      <div className="flex-1 flex flex-col">
        {/* Post content */}
        <div className="flex-1 overflow-hidden">
          {post.images.length > 0 ? (
            <div className="relative h-full">
              <img 
                src={post.images[currentImageIndex]}
                alt="Post content"
                className="w-full h-full object-contain bg-black"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const width = rect.width;
                  
                  if (clickX < width / 2 && currentImageIndex > 0) {
                    setCurrentImageIndex(currentImageIndex - 1);
                  } else if (clickX > width / 2 && currentImageIndex < post.images.length - 1) {
                    setCurrentImageIndex(currentImageIndex + 1);
                  }
                }}
              />
              
              {/* Image indicators */}
              {post.images.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {post.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-subtle p-8">
              <p className="text-foreground text-xl text-center max-w-md">
                {post.content}
              </p>
            </div>
          )}
        </div>

        {/* Post details */}
        <div className="bg-background border-t border-border max-h-96 flex flex-col">
          {/* Post header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigate(`/user/${postUser.id}`)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={postUser.avatar} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                    {postUser.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{postUser.username}</p>
                    {postUser.isVerified && (
                      <VerificationBadge size={20} />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatTimeAgo(post.createdAt)}</p>
                </div>
              </button>
              
              <Button variant="ghost" size="icon" className="text-foreground">
                <MoreHorizontal size={20} />
              </Button>
            </div>

            {/* Post actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLike}
                  className={`h-8 w-8 ${isLiked ? 'text-red-500' : 'text-foreground hover:text-red-500'}`}
                >
                  <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-primary">
                  <MessageCircle size={20} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-primary">
                  <Send size={20} />
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-primary">
                <Bookmark size={20} />
              </Button>
            </div>

            {/* Likes and content */}
            <div className="space-y-2">
              <p className="font-semibold text-sm text-foreground">
                {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
              </p>
              
              {post.content && post.images.length > 0 && (
                <div className="text-sm text-foreground">
                  <span className="font-semibold">{postUser.username}</span> {post.content}
                </div>
              )}
            </div>
          </div>

          {/* Comments section */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {post.comments.map((comment) => {
                  const commentUser = getUserById(comment.userId);
                  if (!commentUser) return null;

                  return (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={commentUser.avatar} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold text-xs">
                          {commentUser.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">{commentUser.username}</span>
                          {commentUser.isVerified && (
                            <VerificationBadge size={16} />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Add comment */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold text-xs">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 border-none bg-transparent focus:ring-0"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <Button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  variant="ghost"
                  className="text-primary font-semibold"
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostViewer;
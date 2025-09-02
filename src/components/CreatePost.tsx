import { useState, useRef } from "react";
import { Camera, Video, X, Image as ImageIcon, Hash, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createPost, getCurrentProfile } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isReel, setIsReel] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      toast({
        title: "Too many images",
        description: "You can only upload up to 10 images",
        variant: "destructive"
      });
      return;
    }
    setSelectedImages(files);
    setSelectedVideo(null); // Clear video if images are selected
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
      setSelectedImages([]); // Clear images if video is selected
      setIsReel(true); // Auto-enable reel mode for videos
      setAspectRatio("9:16");
    }
  };

  const addHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      setHashtags([...hashtags, hashtagInput.trim()]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (index: number) => {
    setHashtags(hashtags.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0 && !selectedVideo) {
      toast({
        title: "Empty post",
        description: "Please add some content or media",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await createPost(
        content.trim(),
        selectedImages.length > 0 ? selectedImages : undefined,
        selectedVideo || undefined,
        isReel,
        aspectRatio,
        hashtags.length > 0 ? hashtags : undefined
      );

      toast({
        title: "Post created",
        description: "Your post has been shared successfully",
      });

      // Reset form
      setContent("");
      setSelectedImages([]);
      setSelectedVideo(null);
      setIsReel(false);
      setAspectRatio("1:1");
      setHashtags([]);
      
      navigate("/");
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span>Create New Post</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Content Input */}
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none border-none shadow-none text-lg placeholder:text-muted-foreground/60 focus-visible:ring-0"
            maxLength={2200}
          />

          {/* Media Preview */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {selectedImages.map((file, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedImages(files => files.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white w-6 h-6"
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selectedVideo && (
            <div className="relative aspect-video max-w-md mx-auto">
              <video
                src={URL.createObjectURL(selectedVideo)}
                controls
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedVideo(null);
                  setIsReel(false);
                  setAspectRatio("1:1");
                }}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white w-6 h-6"
              >
                <X size={12} />
              </Button>
            </div>
          )}

          {/* Media Upload Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
              className="flex-1"
              disabled={selectedVideo !== null}
            >
              <ImageIcon size={20} className="mr-2" />
              Photos
            </Button>
            <Button
              variant="outline"
              onClick={() => videoInputRef.current?.click()}
              className="flex-1"
              disabled={selectedImages.length > 0}
            >
              <Video size={20} className="mr-2" />
              Video
            </Button>
          </div>

          {/* Video/Reel Options */}
          {(selectedVideo || selectedImages.length > 0) && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="reel-toggle">Create as Reel</Label>
                <Switch
                  id="reel-toggle"
                  checked={isReel}
                  onCheckedChange={setIsReel}
                  disabled={selectedVideo !== null} // Auto-enabled for videos
                />
              </div>

              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <div className="flex gap-2">
                  {['1:1', '4:5', '9:16'].map((ratio) => (
                    <Button
                      key={ratio}
                      variant={aspectRatio === ratio ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAspectRatio(ratio)}
                    >
                      {ratio}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hashtags */}
          <div className="space-y-3">
            <Label>Hashtags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add hashtag..."
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addHashtag();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={addHashtag} variant="outline">
                <Hash size={16} />
              </Button>
            </div>
            
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeHashtag(index)}
                  >
                    #{tag} <X size={12} className="ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (!content.trim() && selectedImages.length === 0 && !selectedVideo)}
            className="w-full bg-gradient-primary text-primary-foreground"
          >
            {isLoading ? "Posting..." : isReel ? "Share Reel" : "Share Post"}
          </Button>

          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePost;
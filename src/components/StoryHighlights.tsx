import { useState, useEffect } from "react";
import { Plus, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserHighlights, createStoryHighlight, StoryHighlight } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface StoryHighlightsProps {
  userId: string;
  isOwner?: boolean;
}

const StoryHighlights = ({ userId, isOwner = false }: StoryHighlightsProps) => {
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newHighlightTitle, setNewHighlightTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadHighlights();
  }, [userId]);

  const loadHighlights = async () => {
    try {
      const data = await getUserHighlights(userId);
      setHighlights(data);
    } catch (error) {
      console.error('Error loading highlights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHighlight = async () => {
    if (!newHighlightTitle.trim()) return;

    setIsCreating(true);
    try {
      const newHighlight = await createStoryHighlight(newHighlightTitle.trim());
      setHighlights(prev => [newHighlight, ...prev]);
      setNewHighlightTitle("");
      toast({
        title: "Highlight created",
        description: "Your new story highlight has been created",
      });
    } catch (error) {
      console.error('Error creating highlight:', error);
      toast({
        title: "Error",
        description: "Failed to create story highlight",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 px-4 py-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-3 bg-muted rounded mt-2 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 px-4 py-2 overflow-x-auto">
      {/* Add new highlight button (only for owner) */}
      {isOwner && (
        <Dialog>
          <DialogTrigger asChild>
            <div className="flex flex-col items-center cursor-pointer flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/50 hover:border-primary flex items-center justify-center transition-colors">
                <Plus size={24} className="text-muted-foreground hover:text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">New</p>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Story Highlight</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Highlight Title</Label>
                <Input
                  id="title"
                  placeholder="Enter highlight title..."
                  value={newHighlightTitle}
                  onChange={(e) => setNewHighlightTitle(e.target.value)}
                  maxLength={50}
                />
              </div>
              <Button
                onClick={handleCreateHighlight}
                disabled={!newHighlightTitle.trim() || isCreating}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Highlight"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Existing highlights */}
      {highlights.map((highlight) => (
        <div key={highlight.id} className="flex flex-col items-center cursor-pointer flex-shrink-0">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-muted">
              <AvatarImage 
                src={highlight.cover_image_url || highlight.stories?.[0]?.image_url} 
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                {highlight.title.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-background border border-border rounded-full"
              >
                <Edit3 size={12} />
              </Button>
            )}
          </div>
          <p className="text-xs text-foreground mt-1 text-center max-w-[64px] truncate">
            {highlight.title}
          </p>
        </div>
      ))}

      {highlights.length === 0 && !isOwner && (
        <div className="flex items-center justify-center w-full py-8">
          <p className="text-muted-foreground text-sm">No story highlights yet</p>
        </div>
      )}
    </div>
  );
};

export default StoryHighlights;

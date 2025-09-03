import { useState, useRef } from "react";
import { X, Type, Palette, Smile, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/button-variants";

interface StoryEditorProps {
  selectedImage?: string;
  selectedVideo?: string;
  onCancel: () => void;
  onShare: (content: string, textOverlay?: string, textColor?: string) => void;
}

const StoryEditor = ({ selectedImage, selectedVideo, onCancel, onShare }: StoryEditorProps) => {
  const [textOverlay, setTextOverlay] = useState("");
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textColor, setTextColor] = useState("#ffffff");
  const [caption, setCaption] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colors = [
    "#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", 
    "#ffff00", "#ff00ff", "#00ffff", "#ff8800", "#8800ff"
  ];

  const handleShare = () => {
    onShare(caption, textOverlay, textColor);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 animate-fade-in">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onCancel}
          className="text-white hover:bg-white/20 transition-all duration-200"
        >
          <X size={20} />
        </Button>
        <h2 className="text-white font-semibold">Create Story</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowTextEditor(!showTextEditor)}
            className="text-white hover:bg-white/20 transition-all duration-200"
          >
            <Type size={20} />
          </Button>
          <GradientButton
            variant="primary"
            onClick={handleShare}
            className="px-4 py-2 transition-all duration-200 hover:scale-105"
          >
            Share
          </GradientButton>
        </div>
      </div>

      {/* Story Preview */}
      <div className="flex-1 relative flex items-center justify-center animate-scale-in">
        {selectedImage ? (
          <div className="relative w-full h-full max-w-sm shadow-2xl">
            <img 
              src={selectedImage} 
              alt="Story preview" 
              className="w-full h-full object-cover rounded-lg transition-transform duration-300"
            />
            {textOverlay && (
              <div 
                className="absolute inset-0 flex items-center justify-center p-4 animate-fade-in"
                style={{ color: textColor }}
              >
                <p 
                  className="text-2xl font-bold text-center break-words max-w-full transition-all duration-300"
                  style={{ 
                    textShadow: textColor === "#ffffff" ? "2px 2px 4px rgba(0,0,0,0.8)" : "2px 2px 4px rgba(255,255,255,0.8)",
                    wordWrap: "break-word"
                  }}
                >
                  {textOverlay}
                </p>
              </div>
            )}
          </div>
        ) : selectedVideo ? (
          <div className="relative w-full h-full max-w-sm shadow-2xl">
            <video 
              src={selectedVideo} 
              className="w-full h-full object-cover rounded-lg transition-transform duration-300"
              controls
              muted
              autoPlay
            />
            {textOverlay && (
              <div 
                className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none animate-fade-in"
                style={{ color: textColor }}
              >
                <p 
                  className="text-2xl font-bold text-center break-words max-w-full transition-all duration-300"
                  style={{ 
                    textShadow: textColor === "#ffffff" ? "2px 2px 4px rgba(0,0,0,0.8)" : "2px 2px 4px rgba(255,255,255,0.8)",
                    wordWrap: "break-word"
                  }}
                >
                  {textOverlay}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full max-w-sm bg-gradient-primary rounded-lg flex items-center justify-center p-8 shadow-2xl">
            <p className="text-white text-xl text-center transition-all duration-300">
              {textOverlay || "Tap to add text"}
            </p>
          </div>
        )}
      </div>

      {/* Text Editor */}
      {showTextEditor && (
        <div className="bg-black/90 p-4 space-y-4 animate-slide-up">
          <Textarea
            placeholder="Add text to your story..."
            value={textOverlay}
            onChange={(e) => setTextOverlay(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60 resize-none focus:border-white/50 transition-all duration-200"
            rows={2}
          />
          
          {/* Color Picker */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Palette size={16} className="text-white flex-shrink-0" />
            {colors.map(color => (
              <button
                key={color}
                onClick={() => setTextColor(color)}
                className={`w-8 h-8 rounded-full flex-shrink-0 border-2 transition-all duration-200 hover:scale-110 ${
                  textColor === color ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Caption */}
      <div className="bg-black/90 p-4 border-t border-white/10 animate-fade-in">
        <Textarea
          placeholder="Add a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 resize-none focus:border-white/50 transition-all duration-200"
          rows={2}
        />
      </div>
    </div>
  );
};

export default StoryEditor;
import { useState, useEffect } from "react";
import { ArrowLeft, Download, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const QRCode = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !profile) {
      navigate("/auth");
      return;
    }

    // Generate QR code URL using a free QR code service
    const profileUrl = `${window.location.origin}/user/${profile.user_id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}`;
    setQrCodeUrl(qrUrl);
  }, [user, profile, navigate]);

  const handleShare = async () => {
    if (!profile) return;
    
    const profileUrl = `${window.location.origin}/user/${profile.user_id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Follow @${profile.username} on Montage`,
          text: `Check out @${profile.username}'s profile on Montage`,
          url: profileUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl);
        toast({
          title: "Link copied",
          description: "Profile link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive"
        });
      }
    }
  };

  const handleCopyLink = async () => {
    if (!profile) return;
    
    const profileUrl = `${window.location.origin}/user/${profile.user_id}`;
    
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link copied",
        description: "Profile link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${profile?.username}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code downloaded",
      description: "QR code saved to your device",
    });
  };

  if (!user || !profile) {
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
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-muted h-9 w-9"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-lg font-medium text-foreground">QR Code</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="text-foreground hover:bg-muted h-9 w-9"
          >
            <Share2 size={20} />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Profile Info */}
        <div className="text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-muted text-foreground font-medium text-2xl">
              {(profile.full_name || profile.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold text-foreground mb-1">{profile.username}</h2>
          <p className="text-muted-foreground">{profile.full_name}</p>
        </div>

        {/* QR Code */}
        <Card className="p-6">
          <CardContent className="p-0 text-center">
            <div className="w-full max-w-xs mx-auto mb-4 bg-white p-4 rounded-lg">
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code"
                  className="w-full h-full"
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              People can scan this QR code to follow you on Montage
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex-1 flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex-1 flex items-center gap-2"
              >
                <Copy size={16} />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-medium text-foreground mb-2">How to use QR codes</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Save or screenshot this QR code</li>
              <li>• Share it anywhere you want people to find you</li>
              <li>• Anyone can scan it with their camera to see your profile</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QRCode;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, UserPlus, MessageCircle, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser, getUsers, User } from "@/lib/storage";

interface ActivityItem {
  id: string;
  type: "like" | "follow" | "comment" | "mention";
  user: User;
  content?: string;
  postImage?: string;
  timestamp: string;
}

const Activity = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activities] = useState<ActivityItem[]>([]); // Empty for new app
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    
    setCurrentUser(user);
    setUsers(getUsers());
  }, [navigate]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart size={16} className="text-destructive" />;
      case "follow":
        return <UserPlus size={16} className="text-primary" />;
      case "comment":
        return <MessageCircle size={16} className="text-primary" />;
      default:
        return <Heart size={16} className="text-muted-foreground" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "like":
        return "liked your post";
      case "follow":
        return "started following you";
      case "comment":
        return "commented on your post";
      case "mention":
        return "mentioned you in a comment";
      default:
        return "interacted with your content";
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 h-16 flex items-center">
          <h1 className="text-xl font-bold text-foreground">Activity</h1>
        </div>
      </header>

      <div className="p-4">
        <Tabs defaultValue="you" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/80 rounded-2xl p-1 mb-6 h-12">
            <TabsTrigger value="you" className="rounded-xl font-medium data-[state=active]:bg-card data-[state=active]:text-foreground">
              For you
            </TabsTrigger>
            <TabsTrigger value="following" className="rounded-xl font-medium data-[state=active]:bg-card data-[state=active]:text-foreground">
              Following
            </TabsTrigger>
          </TabsList>

          <TabsContent value="you" className="space-y-3">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mb-6 shadow-glow">
                  <Heart size={28} className="text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Activity on your posts</h2>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  When someone likes or comments on one of your posts, you'll see it here.
                </p>
              </div>
            ) : (
              activities.map(activity => (
                <Card key={activity.id} className="border border-border hover:border-primary/20 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold text-sm">
                            {activity.user.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">
                              <span className="font-semibold">{activity.user.username}</span>{" "}
                              <span className="text-muted-foreground">{getActivityText(activity)}</span>
                            </p>
                            {activity.content && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                "{activity.content}"
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                          
                          {activity.postImage && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted ml-3 flex-shrink-0">
                              <img 
                                src={activity.postImage} 
                                alt="Post"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {activity.type === "follow" && (
                        <Button variant="outline" size="sm" className="text-xs px-3 py-1 rounded-full">
                          Follow
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-3">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mb-6 shadow-glow">
                <UserPlus size={28} className="text-secondary-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Follow people you know</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                See activity from accounts you follow here.
              </p>
              <Button 
                onClick={() => navigate("/search")}
                className="bg-gradient-primary text-primary-foreground px-6 py-3 rounded-full font-medium shadow-glow hover:shadow-lg transition-all duration-300"
              >
                Find People
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Activity;
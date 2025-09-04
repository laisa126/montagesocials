import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Edit, Send, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllProfiles, getConversations, Profile, Conversation } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const Messages = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    
    const loadData = async () => {
      try {
        const [usersData, conversationsData] = await Promise.all([
          getAllProfiles(),
          getConversations()
        ]);
        setUsers(usersData);
        setConversations(conversationsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, navigate]);

  const filteredUsers = users.filter(user => 
    user.user_id !== currentUser?.id &&
    (user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getOtherParticipant = (conversation: Conversation) => {
    // Find the other participant from the conversation participants
    const otherParticipant = conversation.conversation_participants?.find(
      p => p.user_id !== currentUser?.id
    );
    
    if (otherParticipant) {
      return users.find(user => user.user_id === otherParticipant.user_id);
    }
    
    return null;
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-accent rounded-xl"
            >
              <ArrowLeft size={22} />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Messages</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-foreground hover:bg-accent rounded-xl"
          >
            <Edit size={20} />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-11 rounded-xl border-0 bg-muted/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>

        {/* Conversations */}
        <div className="space-y-2">
          {searchQuery.trim() ? (
            /* Search Results */
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-2">Start new conversation</h3>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No users found for "{searchQuery}"</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <Card 
                    key={user.id} 
                    className="border border-border hover:border-primary/20 transition-colors cursor-pointer"
                    onClick={() => navigate(`/messages/chat/${user.user_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                            {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{user.username}</h3>
                          <p className="text-sm text-muted-foreground truncate">{user.full_name}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-primary">
                          <Send size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            /* Existing Conversations */
            conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mb-6 shadow-glow">
                  <Send size={28} className="text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Your messages</h2>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  Send private photos and messages to a friend or group.
                </p>
                <Button 
                  className="bg-gradient-primary text-primary-foreground px-6 py-3 rounded-full font-medium shadow-glow hover:shadow-lg transition-all duration-300"
                  onClick={() => setSearchQuery("search")}
                >
                  Start messaging
                </Button>
              </div>
            ) : (
              conversations.map(conversation => {
                const otherUser = getOtherParticipant(conversation);
                if (!otherUser) return null;

                return (
                  <Card 
                    key={conversation.id} 
                    className="border border-border hover:border-primary/20 transition-colors cursor-pointer"
                    onClick={() => navigate(`/messages/chat/${otherUser.user_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={otherUser.avatar_url} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                            {(otherUser.full_name || otherUser.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-foreground">{otherUser.username}</h3>
                            <span className="text-xs text-muted-foreground">
                              {conversation.updated_at ? formatTime(conversation.updated_at) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            Start a conversation
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Montage AI Overlay */}
      <div className="fixed bottom-24 right-4 z-50">
        <Button
          onClick={() => window.open('https://montagea-ai.vercel.app/', '_blank')}
          className="w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-lg hover:scale-105 transition-all duration-300 p-0 border-2 border-background/20"
        >
          <div className="relative flex items-center justify-center">
            <Bot size={24} className="relative z-10" />
            <div className="absolute inset-0 rounded-full bg-gradient-primary animate-pulse opacity-50" />
            <Sparkles size={12} className="absolute -top-1 -right-1 text-yellow-400 animate-bounce" />
          </div>
        </Button>
      </div>
    </div>
  );
};

export default Messages;
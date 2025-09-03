import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Phone, Video } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Profile } from '@/lib/supabase';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface ConversationProps {
  recipientProfile: Profile;
  conversationId?: string;
}

const RealtimeConversation = ({ recipientProfile, conversationId }: ConversationProps) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const [isTyping, setIsTyping] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Setup realtime subscription for messages
  useEffect(() => {
    if (!activeConversationId) return;

    const channel = supabase
      .channel(`conversation:${activeConversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversationId}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.keys(state).filter(key => {
          const presences = state[key];
          return presences.some((presence: any) => presence.typing && key !== user?.id);
        });
        setTyping(typingUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe();

    // Track user presence
    channel.track({
      user_id: user?.id,
      username: profile?.username,
      typing: false,
      online_at: new Date().toISOString()
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, user?.id, profile?.username]);

  // Load existing messages
  useEffect(() => {
    if (!activeConversationId) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
      scrollToBottom();
    };

    loadMessages();
  }, [activeConversationId]);

  // Create conversation if it doesn't exist
  useEffect(() => {
    if (activeConversationId || !user || !recipientProfile) return;

    const createConversation = async () => {
      // First create the conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return;
      }

      // Add participants
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: recipientProfile.user_id }
        ]);

      if (participantError) {
        console.error('Error adding participants:', participantError);
        return;
      }

      setActiveConversationId(conversation.id);
    };

    createConversation();
  }, [activeConversationId, user, recipientProfile]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversationId || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversationId,
          sender_id: user.id,
          content: messageContent
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // Stop typing indicator
      const channel = supabase.channel(`conversation:${activeConversationId}`);
      await channel.track({
        user_id: user.id,
        username: profile?.username,
        typing: false,
        online_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = async () => {
    if (!activeConversationId || !user) return;
    
    setIsTyping(true);
    
    // Send typing indicator
    const channel = supabase.channel(`conversation:${activeConversationId}`);
    await channel.track({
      user_id: user.id,
      username: profile?.username,
      typing: true,
      online_at: new Date().toISOString()
    });

    // Clear typing after 3 seconds of inactivity
    setTimeout(async () => {
      setIsTyping(false);
      await channel.track({
        user_id: user.id,
        username: profile?.username,
        typing: false,
        online_at: new Date().toISOString()
      });
    }, 3000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user || !recipientProfile) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={recipientProfile.avatar_url} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
              {(recipientProfile.full_name || recipientProfile.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{recipientProfile.username}</p>
            {typing.length > 0 && (
              <p className="text-xs text-primary animate-pulse">Typing...</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-foreground">
            <Phone size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-foreground">
            <Video size={20} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === user.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-2xl ${
                    isOwn
                      ? 'bg-primary text-primary-foreground ml-12'
                      : 'bg-muted text-foreground mr-12'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 opacity-70 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-3">
          <Input
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (e.target.value.length > 0) {
                handleTyping();
              }
            }}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-muted border-none focus:ring-1 focus:ring-primary rounded-full px-4"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RealtimeConversation;
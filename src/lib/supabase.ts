import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Types
export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  images: string[] | null;
  video_url?: string | null;
  aspect_ratio?: string;
  is_reel?: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  post_likes?: { user_id: string }[];
  comments?: Comment[];
  hashtags?: Hashtag[];
  user_tags?: UserTag[];
  is_saved?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface Story {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  text_overlay: string | null;
  text_color: string | null;
  close_friends_only?: boolean;
  expires_at: string;
  created_at: string;
  profiles?: Profile;
  story_views?: { user_id: string }[];
  story_likes?: { user_id: string }[];
}

export interface Hashtag {
  id: string;
  name: string;
  post_count: number;
  created_at: string;
}

export interface UserTag {
  id: string;
  post_id: string;
  tagged_user_id: string;
  tagger_user_id: string;
  x_position?: number;
  y_position?: number;
  created_at: string;
  profiles?: Profile;
}

export interface StoryHighlight {
  id: string;
  user_id: string;
  title: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
  stories?: Story[];
}

export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
  posts?: Post;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  conversation_participants?: {
    user_id: string;
    profiles?: Profile;
  }[];
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  profiles?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'story_like' | 'story_reply';
  from_user_id: string;
  post_id?: string;
  story_id?: string;
  comment_id?: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  profiles?: Profile;
}

// File Upload Utilities
export const uploadFile = async (file: File, bucket: string, folder?: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
    
  return publicUrl;
};

// Auth functions
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Profile functions
export const getCurrentProfile = async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

export const getProfileById = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

export const getProfileByUsername = async (username: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return data || [];
};

export const uploadAvatar = async (file: File): Promise<string> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  return await uploadFile(file, 'avatars', user.id);
};

export const updateProfileAvatar = async (avatarUrl: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', user.id);

  if (error) throw error;
};

// Posts functions
export const getPosts = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }

  // Get profiles, likes and comments separately for each post
  const postsWithDetails = await Promise.all(
    (data || []).map(async (post) => {
      const [profileResult, likesResult, commentsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', post.user_id).single(),
        supabase.from('post_likes').select('user_id').eq('post_id', post.id),
        supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true })
      ]);

      // Get comment profiles
      let commentsWithProfiles = [];
      if (commentsResult.data && commentsResult.data.length > 0) {
        commentsWithProfiles = await Promise.all(
          commentsResult.data.map(async (comment) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', comment.user_id)
              .single();
            
            return {
              ...comment,
              profiles: profileData
            };
          })
        );
      }

      return {
        ...post,
        profiles: profileResult.data,
        post_likes: likesResult.data || [],
        comments: commentsWithProfiles
      };
    })
  );

  return postsWithDetails;
};

export const createPost = async (
  content: string, 
  imageFiles?: File[], 
  videoFile?: File,
  isReel: boolean = false,
  aspectRatio: string = '1:1',
  hashtags?: string[]
): Promise<Post> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  let imageUrls: string[] = [];
  let videoUrl: string | null = null;
  
  // Upload images if provided
  if (imageFiles && imageFiles.length > 0) {
    const uploadPromises = imageFiles.map(file => 
      uploadFile(file, 'posts', user.id)
    );
    imageUrls = await Promise.all(uploadPromises);
  }
  
  // Upload video if provided
  if (videoFile) {
    videoUrl = await uploadFile(videoFile, 'posts', user.id);
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content,
      images: imageUrls.length > 0 ? imageUrls : null,
      video_url: videoUrl,
      is_reel: isReel,
      aspect_ratio: aspectRatio
    })
    .select()
    .single();

  if (error) throw error;
  
  // Add hashtags if provided
  if (hashtags && hashtags.length > 0) {
    await addHashtagsToPost(data.id, hashtags);
  }
  
  return data;
};

export const likePost = async (postId: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('post_likes')
    .insert({
      post_id: postId,
      user_id: user.id
    });

  if (error && !error.message.includes('duplicate')) throw error;
  
  // Create notification for post owner
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();
    
  if (post && post.user_id !== user.id) {
    await createNotification(post.user_id, 'like', user.id, postId);
  }
};

export const unlikePost = async (postId: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const addPostComment = async (postId: string, content: string): Promise<Comment> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content
    })
    .select()
    .single();

  if (error) throw error;
  
  // Create notification for post owner
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();
    
  if (post && post.user_id !== user.id) {
    await createNotification(post.user_id, 'comment', user.id, postId);
  }
  
  return data;
};

// Hashtag functions
export const addHashtagsToPost = async (postId: string, hashtags: string[]): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  for (const hashtagName of hashtags) {
    // Clean hashtag name
    const cleanName = hashtagName.replace('#', '').toLowerCase().trim();
    if (!cleanName) continue;

    // Get or create hashtag
    let { data: hashtag } = await supabase
      .from('hashtags')
      .select('id')
      .eq('name', cleanName)
      .single();

    if (!hashtag) {
      const { data: newHashtag, error } = await supabase
        .from('hashtags')
        .insert({ name: cleanName })
        .select('id')
        .single();
      
      if (error) throw error;
      hashtag = newHashtag;
    }

    // Link post to hashtag
    await supabase
      .from('post_hashtags')
      .insert({
        post_id: postId,
        hashtag_id: hashtag.id
      });
  }
};

export const getHashtags = async (limit: number = 50): Promise<Hashtag[]> => {
  const { data, error } = await supabase
    .from('hashtags')
    .select('*')
    .order('post_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const searchHashtags = async (query: string): Promise<Hashtag[]> => {
  const { data, error } = await supabase
    .from('hashtags')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('post_count', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
};

// User tagging functions
export const tagUsersInPost = async (postId: string, userTags: Array<{
  userId: string;
  x: number;
  y: number;
}>): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const tagData = userTags.map(tag => ({
    post_id: postId,
    tagged_user_id: tag.userId,
    tagger_user_id: user.id,
    x_position: tag.x,
    y_position: tag.y
  }));

  const { error } = await supabase
    .from('user_tags')
    .insert(tagData);

  if (error) throw error;
};

// Saved posts functions
export const savePost = async (postId: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('saved_posts')
    .insert({
      user_id: user.id,
      post_id: postId
    });

  if (error && !error.message.includes('duplicate')) throw error;
};

export const unsavePost = async (postId: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('user_id', user.id)
    .eq('post_id', postId);

  if (error) throw error;
};

export const getSavedPosts = async (): Promise<Post[]> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: savedData, error } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  if (!savedData || savedData.length === 0) return [];
  
  const postIds = savedData.map(item => item.post_id);
  
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .in('id', postIds);
    
  if (postsError) throw postsError;
  
  // Get profiles for posts
  const postsWithProfiles = await Promise.all(
    (posts || []).map(async (post) => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', post.user_id)
        .single();
      
      return { ...post, profiles: profileData };
    })
  );
  
  return postsWithProfiles;
};

// Story highlights functions
export const createStoryHighlight = async (title: string, coverImageUrl?: string): Promise<StoryHighlight> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('story_highlights')
    .insert({
      user_id: user.id,
      title,
      cover_image_url: coverImageUrl
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const addStoryToHighlight = async (highlightId: string, storyId: string): Promise<void> => {
  const { error } = await supabase
    .from('story_highlight_items')
    .insert({
      highlight_id: highlightId,
      story_id: storyId
    });

  if (error && !error.message.includes('duplicate')) throw error;
};

export const getUserHighlights = async (userId: string): Promise<StoryHighlight[]> => {
  const { data: highlights, error } = await supabase
    .from('story_highlights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  if (!highlights || highlights.length === 0) return [];
  
  // Get stories for each highlight
  const highlightsWithStories = await Promise.all(
    highlights.map(async (highlight) => {
      const { data: highlightItems } = await supabase
        .from('story_highlight_items')
        .select('story_id')
        .eq('highlight_id', highlight.id);
        
      if (!highlightItems || highlightItems.length === 0) {
        return { ...highlight, stories: [] };
      }
      
      const storyIds = highlightItems.map(item => item.story_id);
      const { data: stories } = await supabase
        .from('stories')
        .select('*')
        .in('id', storyIds);
        
      return { ...highlight, stories: stories || [] };
    })
  );
  
  return highlightsWithStories;
};

// Close friends functions
export const addCloseFriend = async (friendId: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('close_friends')
    .insert({
      user_id: user.id,
      friend_id: friendId
    });

  if (error && !error.message.includes('duplicate')) throw error;
};

export const removeCloseFriend = async (friendId: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('close_friends')
    .delete()
    .eq('user_id', user.id)
    .eq('friend_id', friendId);

  if (error) throw error;
};

export const getCloseFriends = async (): Promise<Profile[]> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: friendsData, error } = await supabase
    .from('close_friends')
    .select('friend_id')
    .eq('user_id', user.id);

  if (error) throw error;
  
  if (!friendsData || friendsData.length === 0) return [];
  
  const friendIds = friendsData.map(item => item.friend_id);
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', friendIds);
    
  if (profilesError) throw profilesError;
  
  return profiles || [];
};

// Stories functions
export const getStories = async (): Promise<Story[]> => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stories:', error);
    return [];
  }

  // Get profiles, views and likes separately
  const storiesWithDetails = await Promise.all(
    (data || []).map(async (story) => {
      const [profileResult, viewsResult, likesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', story.user_id).single(),
        supabase.from('story_views').select('user_id').eq('story_id', story.id),
        supabase.from('story_likes').select('user_id').eq('story_id', story.id)
      ]);

      return {
        ...story,
        profiles: profileResult.data,
        story_views: viewsResult.data || [],
        story_likes: likesResult.data || []
      };
    })
  );

  return storiesWithDetails;
};

export const createStory = async (
  content: string | null,
  imageFile?: File | null,
  videoFile?: File | null,
  textOverlay?: string | null,
  textColor?: string | null,
  closeFriendsOnly: boolean = false
): Promise<Story> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  let imageUrl = null;
  let videoUrl = null;
  
  // Upload media files if provided
  if (imageFile) {
    imageUrl = await uploadFile(imageFile, 'stories', user.id);
  }
  if (videoFile) {
    videoUrl = await uploadFile(videoFile, 'stories', user.id);
  }

  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: user.id,
      content,
      image_url: imageUrl,
      video_url: videoUrl,
      text_overlay: textOverlay,
      text_color: textColor,
      close_friends_only: closeFriendsOnly
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const viewStory = async (storyId: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('story_views')
    .insert({
      story_id: storyId,
      user_id: user.id
    });

  if (error && !error.message.includes('duplicate')) throw error;
};

export const likeStory = async (storyId: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('story_likes')
    .insert({
      story_id: storyId,
      user_id: user.id
    });

  if (error && !error.message.includes('duplicate')) throw error;
  
  // Create notification for story owner
  const { data: story } = await supabase
    .from('stories')
    .select('user_id')
    .eq('id', storyId)
    .single();
    
  if (story && story.user_id !== user.id) {
    await createNotification(story.user_id, 'story_like', user.id, undefined, storyId);
  }
};

// Follow functions
export const followUser = async (targetUserId: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('followers')
    .insert({
      follower_id: user.id,
      following_id: targetUserId
    });

  if (error && !error.message.includes('duplicate')) throw error;
  
  // Create notification for followed user
  await createNotification(targetUserId, 'follow', user.id);
};

export const unfollowUser = async (targetUserId: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('followers')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId);

  if (error) throw error;
};

export const getFollowers = async (userId: string) => {
  const { data, error } = await supabase
    .from('followers')
    .select('follower_id')
    .eq('following_id', userId);

  if (error) {
    console.error('Error fetching followers:', error);
    return [];
  }

  // Get profiles for followers
  if (!data || data.length === 0) return [];

  const followersWithProfiles = await Promise.all(
    data.map(async (follower) => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', follower.follower_id)
        .single();
      
      return {
        follower_id: follower.follower_id,
        profiles: profileData
      };
    })
  );

  return followersWithProfiles;
};

export const getFollowing = async (userId: string) => {
  const { data, error } = await supabase
    .from('followers')
    .select('following_id')
    .eq('follower_id', userId);

  if (error) {
    console.error('Error fetching following:', error);
    return [];
  }

  // Get profiles for following
  if (!data || data.length === 0) return [];

  const followingWithProfiles = await Promise.all(
    data.map(async (following) => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', following.following_id)
        .single();
      
      return {
        following_id: following.following_id,
        profiles: profileData
      };
    })
  );

  return followingWithProfiles;
};

// Get follower count
export const getFollowerCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) {
    console.error('Error getting follower count:', error);
    return 0;
  }

  return count || 0;
};

// Get following count
export const getFollowingCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) {
    console.error('Error getting following count:', error);
    return 0;
  }

  return count || 0;
};

export const isFollowing = async (targetUserId: string): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('followers')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single();

  if (error) return false;
  return !!data;
};

// Messages and conversations
export const getConversations = async (): Promise<Conversation[]> => {
  const user = await getCurrentUser();
  if (!user) return [];

  // Get conversations where user is a participant
  const { data: participantData, error: participantError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (participantError) {
    console.error('Error fetching conversations:', participantError);
    return [];
  }

  if (!participantData || participantData.length === 0) return [];

  const conversationIds = participantData.map(p => p.conversation_id);

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  // Get participants and messages for each conversation
  const conversationsWithDetails = await Promise.all(
    (data || []).map(async (conversation) => {
      const [participantsData, messagesData] = await Promise.all([
        supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversation.id),
        supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })
      ]);

      // Get profiles for participants
      let participantsWithProfiles = [];
      if (participantsData.data && participantsData.data.length > 0) {
        participantsWithProfiles = await Promise.all(
          participantsData.data.map(async (participant) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', participant.user_id)
              .single();
            
            return {
              user_id: participant.user_id,
              profiles: profileData
            };
          })
        );
      }

      return {
        ...conversation,
        conversation_participants: participantsWithProfiles,
        messages: messagesData.data || []
      };
    })
  );

  return conversationsWithDetails;
};

export const createConversation = async (participantUserIds: string[]): Promise<Conversation> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Create the conversation
  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single();

  if (conversationError) throw conversationError;

  // Add all participants
  const participants = [...participantUserIds, user.id];
  const participantInserts = participants.map(userId => ({
    conversation_id: conversationData.id,
    user_id: userId
  }));

  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert(participantInserts);

  if (participantError) throw participantError;

  return conversationData;
};

export const sendMessage = async (conversationId: string, content: string): Promise<Message> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content
    })
    .select()
    .single();

  if (error) throw error;

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
};

// Notifications Functions
export const getNotifications = async (): Promise<Notification[]> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Get profiles separately
  const notificationsWithProfiles = await Promise.all(
    (data || []).map(async (notification) => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url, is_verified')
        .eq('user_id', notification.from_user_id)
        .single();
      
      return {
        ...notification,
        type: notification.type as 'like' | 'comment' | 'follow' | 'story_like' | 'story_reply',
        profiles: profileData
      } as Notification;
    })
  );

  return notificationsWithProfiles;
};

export const createNotification = async (
  userId: string,
  type: 'like' | 'comment' | 'follow' | 'story_like' | 'story_reply',
  fromUserId: string,
  postId?: string,
  storyId?: string,
  commentId?: string,
  message?: string
): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      from_user_id: fromUserId,
      post_id: postId,
      story_id: storyId,
      comment_id: commentId,
      message
    });

  if (error) throw error;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
};

// Admin Functions
export const banUser = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: true })
    .eq('user_id', userId);

  if (error) throw error;
};

export const verifyUser = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: true })
    .eq('user_id', userId);

  if (error) throw error;
};

// Post detail functions
export const getPostById = async (postId: string): Promise<Post> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) throw error;
  
  // Get profile separately
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', data.user_id)
    .single();
    
  return { ...data, profiles: profileData };
};

export const getComments = async (postId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  // Get profiles separately
  const commentsWithProfiles = await Promise.all(
    (data || []).map(async (comment) => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', comment.user_id)
        .single();
      
      return { ...comment, profiles: profileData };
    })
  );
  
  return commentsWithProfiles;
};

export const addComment = async (postId: string, content: string): Promise<Comment> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content
    })
    .select()
    .single();

  if (error) throw error;
  
  // Get profile separately  
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', data.user_id)
    .single();
    
  return { ...data, profiles: profileData };
};

export const getPostLikes = async (postId: string) => {
  const { data, error } = await supabase
    .from('post_likes')
    .select('user_id')
    .eq('post_id', postId);

  if (error) throw error;
  return data || [];
};
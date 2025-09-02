-- Add support for multiple images and videos in posts
ALTER TABLE public.posts 
ADD COLUMN video_url text,
ADD COLUMN aspect_ratio text DEFAULT '1:1',
ADD COLUMN is_reel boolean DEFAULT false;

-- Create hashtags table
CREATE TABLE public.hashtags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  post_count integer DEFAULT 0
);

-- Enable RLS on hashtags
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

-- Create hashtag policies
CREATE POLICY "Hashtags are viewable by everyone" 
ON public.hashtags 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create hashtags" 
ON public.hashtags 
FOR INSERT 
WITH CHECK (true);

-- Create post_hashtags junction table
CREATE TABLE public.post_hashtags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  hashtag_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, hashtag_id)
);

-- Enable RLS on post_hashtags
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

-- Create post_hashtags policies
CREATE POLICY "Post hashtags are viewable by everyone" 
ON public.post_hashtags 
FOR SELECT 
USING (true);

CREATE POLICY "Users can tag their posts with hashtags" 
ON public.post_hashtags 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.posts 
  WHERE posts.id = post_hashtags.post_id 
  AND posts.user_id = auth.uid()
));

-- Create user_tags table for tagging users in posts
CREATE TABLE public.user_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  tagged_user_id uuid NOT NULL,
  tagger_user_id uuid NOT NULL,
  x_position decimal(5,2),
  y_position decimal(5,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, tagged_user_id)
);

-- Enable RLS on user_tags
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

-- Create user_tags policies
CREATE POLICY "User tags are viewable by everyone" 
ON public.user_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Users can tag others in their posts" 
ON public.user_tags 
FOR INSERT 
WITH CHECK (auth.uid() = tagger_user_id AND EXISTS (
  SELECT 1 FROM public.posts 
  WHERE posts.id = user_tags.post_id 
  AND posts.user_id = auth.uid()
));

-- Create saved_posts table
CREATE TABLE public.saved_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on saved_posts
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Create saved_posts policies
CREATE POLICY "Users can view their saved posts" 
ON public.saved_posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts" 
ON public.saved_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts" 
ON public.saved_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create story_highlights table
CREATE TABLE public.story_highlights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  cover_image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on story_highlights
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;

-- Create story_highlights policies
CREATE POLICY "Story highlights are viewable by everyone" 
ON public.story_highlights 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own highlights" 
ON public.story_highlights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights" 
ON public.story_highlights 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights" 
ON public.story_highlights 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create story_highlight_items table
CREATE TABLE public.story_highlight_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  highlight_id uuid NOT NULL,
  story_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(highlight_id, story_id)
);

-- Enable RLS on story_highlight_items
ALTER TABLE public.story_highlight_items ENABLE ROW LEVEL SECURITY;

-- Create story_highlight_items policies
CREATE POLICY "Highlight items are viewable by everyone" 
ON public.story_highlight_items 
FOR SELECT 
USING (true);

CREATE POLICY "Users can add stories to their highlights" 
ON public.story_highlight_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.story_highlights 
  WHERE story_highlights.id = story_highlight_items.highlight_id 
  AND story_highlights.user_id = auth.uid()
));

-- Create close_friends table
CREATE TABLE public.close_friends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS on close_friends
ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;

-- Create close_friends policies
CREATE POLICY "Users can view their close friends list" 
ON public.close_friends 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add close friends" 
ON public.close_friends 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove close friends" 
ON public.close_friends 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add close_friends_only column to stories
ALTER TABLE public.stories 
ADD COLUMN close_friends_only boolean DEFAULT false;

-- Update stories RLS policy to respect close friends
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
DROP POLICY IF EXISTS "stories_read_public" ON public.stories;

CREATE POLICY "Stories are viewable with restrictions" 
ON public.stories 
FOR SELECT 
USING (
  expires_at > now() 
  AND (
    close_friends_only = false 
    OR auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.close_friends 
      WHERE close_friends.user_id = stories.user_id 
      AND close_friends.friend_id = auth.uid()
    )
  )
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_story_highlights_updated_at
BEFORE UPDATE ON public.story_highlights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
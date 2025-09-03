import { useEffect, useMemo, useState } from "react"; import { useParams, useNavigate } from "react-router-dom"; import { ArrowLeft, Settings, MoreHorizontal, Grid, Bookmark, Heart, MessageCircle, Tag, AtSign, PlayCircle, Share2, Flag, Ban, Sparkles, Pin, PinOff, ShieldCheck, HandCoins, Store, } from "lucide-react"; import { Button } from "@/components/ui/button"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; import { Badge } from "@/components/ui/badge"; import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; import { Input } from "@/components/ui/input"; import { Switch } from "@/components/ui/switch"; import { useToast } from "@/hooks/use-toast"; import { useAuth } from "@/hooks/useAuth"; import { getProfileById, getPosts, followUser, unfollowUser, getFollowers, getFollowing, Profile, Post, } from "@/lib/supabase";

// Lightweight local types for optional/advanced features // (These can be replaced by your actual Supabase types later.) type Reel = { id: string; user_id: string; video_url: string; cover_url?: string; caption?: string }; type Story = { id: string; media_url: string; type: "image" | "video"; expires_at: string }; type Highlight = { id: string; title: string; cover_url?: string }; type SuggestedUser = { user_id: string; username: string; avatar_url?: string; is_verified?: boolean };

const UserProfile = () => { const { userId } = useParams<{ userId: string }>(); const navigate = useNavigate(); const { toast } = useToast(); const { user, profile } = useAuth();

const [profileUser, setProfileUser] = useState<Profile | null>(null); const [userPosts, setUserPosts] = useState<Post[]>([]); const [pinnedPostIds, setPinnedPostIds] = useState<string[]>([]); const [reels, setReels] = useState<Reel[]>([]); const [stories, setStories] = useState<Story[]>([]); const [highlights, setHighlights] = useState<Highlight[]>([]); const [saved, setSaved] = useState<Post[]>([]); const [liked, setLiked] = useState<Post[]>([]); const [tagged, setTagged] = useState<Post[]>([]); const [mentions, setMentions] = useState<Post[]>([]); const [suggested, setSuggested] = useState<SuggestedUser[]>([]); const [mutualsPreview, setMutualsPreview] = useState<string>(""); const [isFollowing, setIsFollowing] = useState(false); const [followers, setFollowers] = useState<any[]>([]); const [following, setFollowing] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [privacyLoading, setPrivacyLoading] = useState(false); const [isPrivate, setIsPrivate] = useState(false);

// Dialog state const [shareOpen, setShareOpen] = useState(false); const [tipOpen, setTipOpen] = useState(false); const [tipAmount, setTipAmount] = useState<string>("200"); const [storyViewer, setStoryViewer] = useState<{ open: boolean; index: number }>(() => ({ open: false, index: 0 }));

useEffect(() => { if (!user) { navigate("/auth"); return; }

const loadUserData = async () => {
  if (!userId) return;
  try {
    setLoading(true);
    const [profileData, postsData, followersData, followingData] = await Promise.all([
      getProfileById(userId),
      getPosts(),
      getFollowers(userId),
      getFollowing(userId),
    ]);

    if (profileData) {
      setProfileUser(profileData);
      const myPosts = postsData.filter((post) => post.user_id === userId);
      setUserPosts(myPosts);
      setFollowers(followersData);
      setFollowing(followingData);
      const isCurrentlyFollowing = followersData.some((f) => f.follower_id === user.id);
      setIsFollowing(isCurrentlyFollowing);
      setIsPrivate(!!(profileData as any)?.is_private);
    }

    // Dynamically import optional API methods to avoid hard build deps
    const api: any = await import("@/lib/supabase").catch(() => ({}));

    // Fire-and-forget optional fetches; fall back gracefully
    if (api.getSavedPosts) api.getSavedPosts(userId).then(setSaved).catch(() => {});
    if (api.getLikedPosts) api.getLikedPosts(userId).then(setLiked).catch(() => {});
    if (api.getTaggedPosts) api.getTaggedPosts(userId).then(setTagged).catch(() => {});
    if (api.getMentionsForUser) api.getMentionsForUser(userId).then(setMentions).catch(() => {});
    if (api.getReelsForUser) api.getReelsForUser(userId).then(setReels).catch(() => {});
    if (api.getStoriesForUser) api.getStoriesForUser(userId).then(setStories).catch(() => {});
    if (api.getHighlightsForUser) api.getHighlightsForUser(userId).then(setHighlights).catch(() => {});
    if (api.getPinnedPostIds) api.getPinnedPostIds(userId).then(setPinnedPostIds).catch(() => {});
    if (api.getSuggestions) api.getSuggestions(userId).then(setSuggested).catch(() => {});
    if (api.getMutualFollowersNames && user?.id) api.getMutualFollowersNames(user.id, userId).then(setMutualsPreview).catch(() => {});
  } catch (error) {
    console.error("Error loading user data:", error);
    toast({ title: "Error", description: "Failed to load user profile", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};

loadUserData();

}, [userId, user, navigate, toast]);

const isOwnProfile = user && profileUser && user.id === profileUser.user_id;

const handleFollowToggle = async () => { if (!user || !profileUser) return; try { if (isFollowing) { await unfollowUser(profileUser.user_id); setIsFollowing(false); setFollowers((prev) => prev.filter((f) => f.follower_id !== user.id)); toast({ title: "Unfollowed", description: You unfollowed @${profileUser.username} }); } else { await followUser(profileUser.user_id); setIsFollowing(true); setFollowers((prev) => [...prev, { follower_id: user.id }]); toast({ title: "Following", description: You are now following @${profileUser.username} }); } } catch (error) { console.error("Error toggling follow:", error); toast({ title: "Error", description: "Failed to update follow status", variant: "destructive" }); } };

const handleShare = async () => { if (!profileUser) return; const url = ${window.location.origin}/user/${profileUser.user_id}; if (navigator.share) { try { await navigator.share({ title: profileUser.username, url }); } catch {} } else { await navigator.clipboard.writeText(url); toast({ title: "Link copied", description: "Profile URL copied to clipboard" }); } setShareOpen(false); };

const handleBlock = async () => { try { const api: any = await import("@/lib/supabase"); await api.blockUser?.(profileUser!.user_id); toast({ title: "Blocked", description: You blocked @${profileUser!.username} }); navigate("/"); } catch (e) { toast({ title: "Error", description: "Could not block user", variant: "destructive" }); } };

const handleReport = async () => { try { const api: any = await import("@/lib/supabase"); await api.reportUser?.(profileUser!.user_id, { reason: "Profile violation" }); toast({ title: "Reported", description: "Thanks for your report" }); } catch (e) { toast({ title: "Error", description: "Could not submit report", variant: "destructive" }); } };

const handlePrivacyToggle = async (val: boolean) => { if (!isOwnProfile) return; setPrivacyLoading(true); try { const api: any = await import("@/lib/supabase"); await api.togglePrivacy?.(val); setIsPrivate(val); toast({ title: val ? "Private account" : "Public account" }); } catch (e) { toast({ title: "Error", description: "Could not update privacy", variant: "destructive" }); } finally { setPrivacyLoading(false); } };

const handlePinToggle = async (postId: string, pin: boolean) => { if (!isOwnProfile) return; try { const api: any = await import("@/lib/supabase"); if (pin) { await api.pinPost?.(postId); setPinnedPostIds((prev) => Array.from(new Set([...prev, postId]))); } else { await api.unpinPost?.(postId); setPinnedPostIds((prev) => prev.filter((id) => id !== postId)); } } catch (e) { toast({ title: "Error", description: "Could not update pin", variant: "destructive" }); } };

const pinnedPosts = useMemo(() => userPosts.filter((p) => pinnedPostIds.includes(p.id)), [userPosts, pinnedPostIds]); const regularPosts = useMemo(() => userPosts.filter((p) => !pinnedPostIds.includes(p.id)), [userPosts, pinnedPostIds]);

if (!user || !profile || loading || !profileUser) { return ( <div className="min-h-screen bg-background px-4 py-16"> <div className="mx-auto max-w-md animate-pulse space-y-4"> <div className="h-40 w-full rounded-2xl bg-muted" /> <div className="-mt-12 flex justify-center"> <div className="h-32 w-32 rounded-full bg-muted border-4 border-background" /> </div> <div className="h-6 w-40 mx-auto rounded bg-muted" /> <div className="h-4 w-64 mx-auto rounded bg-muted" /> <div className="grid grid-cols-3 gap-6 pt-4"> <div className="h-8 bg-muted rounded" /> <div className="h-8 bg-muted rounded" /> <div className="h-8 bg-muted rounded" /> </div> </div> </div> ); }

return ( <div className="min-h-screen bg-background pb-24"> {/* Header */} <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"> <div className="flex items-center justify-between px-4 h-16"> <div className="flex items-center gap-3"> <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back"> <ArrowLeft size={20} /> </Button> <div className="flex items-center gap-2"> <h1 className="text-lg font-semibold">{profileUser.username}</h1> {profileUser.is_verified && <Badge className="bg-primary text-primary-foreground">✓</Badge>} </div> </div>

<div className="flex items-center gap-2">
        {isOwnProfile && (
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} aria-label="Settings">
            <Settings size={18} />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More">
              <MoreHorizontal size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isOwnProfile && (
              <>
                <DropdownMenuItem onClick={() => setShareOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" /> Share Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTipOpen(true)}>
                  <HandCoins className="mr-2 h-4 w-4" /> Tip @ {profileUser.username}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-red-600">
                      <Ban className="mr-2 h-4 w-4" /> Block User
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Block @{profileUser.username}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        They will no longer be able to find your profile, posts, or message you.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600" onClick={handleBlock}>Block</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem>
                      <Flag className="mr-2 h-4 w-4" /> Report User
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Report @{profileUser.username}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        We will review this profile for violations of community guidelines.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReport}>Submit</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            {isOwnProfile && (
              <>
                <DropdownMenuItem onClick={() => navigate(`/creator/insights`)}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Insights
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/activity`)}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Activity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/shop/${profileUser.user_id}`)}>
                  <Store className="mr-2 h-4 w-4" /> My Shop
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>

  {/* Cover image */}
  <div className="h-40 w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500" />

  {/* Profile info */}
  <section className="-mt-16 px-4 text-center">
    <Avatar className="w-32 h-32 border-4 border-background mx-auto shadow-xl">
      <AvatarImage src={profileUser.avatar_url} alt={`${profileUser.username} avatar`} />
      <AvatarFallback className="text-xl">{(profileUser.full_name || profileUser.username).charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>

    <div className="mt-3 space-y-1">
      <div className="flex items-center justify-center gap-2">
        <h2 className="text-2xl font-bold">{profileUser.username}</h2>
        {profileUser.is_verified && <Badge className="bg-primary text-primary-foreground">✓</Badge>}
      </div>
      {profileUser.full_name && <p className="text-muted-foreground">{profileUser.full_name}</p>}
      {profileUser.bio && <p className="text-sm max-w-md mx-auto leading-relaxed">{profileUser.bio}</p>}
      {(profileUser as any)?.website && (
        <a className="text-primary text-sm hover:underline" href={(profileUser as any).website} target="_blank" rel="noreferrer">
          {(profileUser as any).website}
        </a>
      )}
      {!isOwnProfile && mutualsPreview && (
        <p className="text-xs text-muted-foreground">Followed by {mutualsPreview}</p>
      )}
    </div>

    {/* Stats */}
    <div className="flex justify-center gap-8 py-4">
      <button className="text-center" onClick={() => navigate(`/user/${profileUser.user_id}/posts`)}>
        <div className="text-xl font-bold">{userPosts.length}</div>
        <div className="text-xs text-muted-foreground">Posts</div>
      </button>
      <button className="text-center" onClick={() => navigate(`/user/${profileUser.user_id}/followers`)}>
        <div className="text-xl font-bold">{followers.length}</div>
        <div className="text-xs text-muted-foreground">Followers</div>
      </button>
      <button className="text-center" onClick={() => navigate(`/user/${profileUser.user_id}/following`)}>
        <div className="text-xl font-bold">{following.length}</div>
        <div className="text-xs text-muted-foreground">Following</div>
      </button>
    </div>

    {/* Action buttons */}
    {isOwnProfile ? (
      <div className="flex gap-3 justify-center">
        <Button onClick={() => navigate("/profile/edit")} className="rounded-xl">Edit Profile</Button>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border">
          <span className="text-sm">Private</span>
          <Switch disabled={privacyLoading} checked={isPrivate} onCheckedChange={handlePrivacyToggle} />
        </div>
      </div>
    ) : (
      <div className="flex gap-3 px-4">
        <Button onClick={handleFollowToggle} className="flex-1 rounded-xl">
          {isFollowing ? "Following" : "Follow"}
        </Button>
        <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => navigate(`/messages/chat/${profileUser.user_id}`)}>
          Message
        </Button>
      </div>
    )}

    {/* Stories / Highlights */}
    <div className="mt-6 space-y-4">
      {/* Stories row */}
      <div className="flex items-center justify-start gap-4 overflow-x-auto px-2">
        {stories.length > 0 ? (
          stories.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStoryViewer({ open: true, index: i })}
              className="flex flex-col items-center gap-2"
            >
              <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-yellow-400">
                <div className="h-full w-full rounded-full bg-background p-[2px]">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={(profileUser as any).avatar_url} alt="story" />
                    <AvatarFallback>ST</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">Story</span>
            </button>
          ))
        ) : (
          <div className="text-xs text-muted-foreground px-2">No stories</div>
        )}
      </div>

      {/* Highlights row */}
      <div className="flex items-center justify-start gap-6 overflow-x-auto px-2">
        {highlights.map((h) => (
          <div key={h.id} className="flex flex-col items-center gap-1">
            <div className="h-16 w-16 rounded-full border flex items-center justify-center overflow-hidden">
              {h.cover_url ? (
                <img src={h.cover_url} alt={h.title} className="h-full w-full object-cover" />
              ) : (
                <Sparkles size={20} />
              )}
            </div>
            <span className="text-[10px] max-w-16 truncate">{h.title}</span>
          </div>
        ))}
        {isOwnProfile && (
          <button onClick={() => navigate("/stories/highlights/new")} className="text-xs text-primary">+ New highlight</button>
        )}
      </div>
    </div>
  </section>

  {/* Tabs */}
  <section className="mt-6 border-t">
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="grid grid-cols-6 w-full">
        <TabsTrigger value="posts" aria-label="Posts"><Grid size={18} /></TabsTrigger>
        <TabsTrigger value="reels" aria-label="Reels"><PlayCircle size={18} /></TabsTrigger>
        <TabsTrigger value="saved" aria-label="Saved"><Bookmark size={18} /></TabsTrigger>
        <TabsTrigger value="liked" aria-label="Liked"><Heart size={18} /></TabsTrigger>
        <TabsTrigger value="tagged" aria-label="Tagged"><Tag size={18} /></TabsTrigger>
        <TabsTrigger value="mentions" aria-label="Mentions"><AtSign size={18} /></TabsTrigger>
      </TabsList>

      {/* POSTS */}
      <TabsContent value="posts" className="mt-0">
        {pinnedPosts.length > 0 && (
          <div className="p-2">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">Pinned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-1">
                  {pinnedPosts.map((post) => (
                    <PostTile
                      key={post.id}
                      post={post}
                      isOwnProfile={!!isOwnProfile}
                      pinned
                      onPinToggle={(pin) => handlePinToggle(post.id, pin)}
                      onOpen={() => navigate(`/post/${post.id}`)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {userPosts.length === 0 ? (
          <EmptyState icon={<Grid />} title="No Posts Yet" subtitle={isOwnProfile ? "Share your first photo or video" : ""} />
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {regularPosts.map((post) => (
              <PostTile
                key={post.id}
                post={post}
                isOwnProfile={!!isOwnProfile}
                onPinToggle={(pin) => handlePinToggle(post.id, pin)}
                onOpen={() => navigate(`/post/${post.id}`)}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* REELS */}
      <TabsContent value="reels" className="mt-0">
        {reels.length === 0 ? (
          <EmptyState icon={<PlayCircle />} title="No Reels" subtitle={isOwnProfile ? "Create your first reel" : ""} />
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {reels.map((r) => (
              <button key={r.id} className="aspect-[9/16] bg-black overflow-hidden" onClick={() => navigate(`/reel/${r.id}`)}>
                {r.cover_url ? (
                  <img src={r.cover_url} alt={r.caption || "reel"} className="w-full h-full object-cover" />
                ) : (
                  <video src={r.video_url} muted playsInline className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </TabsContent>

      {/* SAVED */}
      <TabsContent value="saved" className="mt-0">
        {!isOwnProfile ? (
          <PrivateState />
        ) : saved.length === 0 ? (
          <EmptyState icon={<Bookmark />} title="No Saved Posts" />
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {saved.map((post) => (
              <PostTile key={post.id} post={post} isOwnProfile={!!isOwnProfile} onOpen={() => navigate(`/post/${post.id}`)} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* LIKED */}
      <TabsContent value="liked" className="mt-0">
        {!isOwnProfile ? (
          <PrivateState />
        ) : liked.length === 0 ? (
          <EmptyState icon={<Heart />} title="No Liked Posts" />
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {liked.map((post) => (
              <PostTile key={post.id} post={post} isOwnProfile={!!isOwnProfile} onOpen={() => navigate(`/post/${post.id}`)} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* TAGGED */}
      <TabsContent value="tagged" className="mt-0">
        {tagged.length === 0 ? (
          <EmptyState icon={<Tag />} title="No Tagged Posts" />
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {tagged.map((post) => (
              <PostTile key={post.id} post={post} isOwnProfile={!!isOwnProfile} onOpen={() => navigate(`/post/${post.id}`)} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* MENTIONS */}
      <TabsContent value="mentions" className="mt-0">
        {mentions.length === 0 ? (
          <EmptyState icon={<AtSign />} title="No Mentions" />
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {mentions.map((post) => (
              <PostTile key={post.id} post={post} isOwnProfile={!!isOwnProfile} onOpen={() => navigate(`/post/${post.id}`)} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  </section>

  {/* Suggested users */}
  {suggested.length > 0 && (
    <section className="mt-6 px-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suggested for you</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggested.map((s) => (
              <div key={s.user_id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={s.avatar_url} alt={`${s.username} avatar`} />
                    <AvatarFallback>{s.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{s.username}</span>
                      {s.is_verified && <Badge className="px-1">✓</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">Suggested for you</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate(`/user/${s.user_id}`)}>View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )}

  {/* Share dialog */}
  <Dialog open={shareOpen} onOpenChange={setShareOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Share profile</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <Input readOnly value={`${window.location.origin}/user/${profileUser.user_id}`} />
        <Button onClick={handleShare}><Share2 className="mr-2 h-4 w-4" /> Copy link / Share</Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* Tip dialog */}
  <Dialog open={tipOpen} onOpenChange={setTipOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Send a tip</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <Input inputMode="numeric" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} placeholder="Amount" />
        <Button
          onClick={async () => {
            try {
              const api: any = await import("@/lib/supabase");
              await api.tipUser?.(profileUser.user_id, Number(tipAmount));
              toast({ title: "Thanks!", description: "Your tip was sent" });
              setTipOpen(false);
            } catch {
              toast({ title: "Error", description: "Could not send tip", variant: "destructive" });
            }
          }}
        >
          <HandCoins className="mr-2 h-4 w-4" /> Tip {profileUser.username}
        </Button>
      </div>
      <DialogFooter />
    </DialogContent>
  </Dialog>

  {/* Story viewer (very simple) */}
  <Dialog open={storyViewer.open} onOpenChange={(o) => setStoryViewer((s) => ({ ...s, open: o }))}>
    <DialogContent className="max-w-sm p-0 overflow-hidden">
      {stories[storyViewer.index]?.type === "video" ? (
        <video src={stories[storyViewer.index]?.media_url} autoPlay controls className="w-full h-full" />
      ) : (
        <img src={stories[storyViewer.index]?.media_url} alt="story" className="w-full h-full object-contain" />
      )}
    </DialogContent>
  </Dialog>
</div>

); };

// --- Small presentational helpers ---

const EmptyState = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (

  <div className="flex flex-col items-center justify-center py-16">
    <div className="w-20 h-20 border-2 border-foreground/40 rounded-full flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-medium">{title}</h3>
    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
  </div>
);const PrivateState = () => (

  <div className="flex flex-col items-center justify-center py-16 text-center">
    <ShieldCheck className="mb-2" />
    <h3 className="text-lg font-medium">This section is private</h3>
    <p className="text-sm text-muted-foreground">Only the owner can see this.</p>
  </div>
);const PostTile = ({ post, onOpen, isOwnProfile, pinned = false, onPinToggle, }: { post: Post; onOpen: () => void; isOwnProfile: boolean; pinned?: boolean; onPinToggle?: (pin: boolean) => void; }) => { return ( <div className="relative group aspect-square bg-muted cursor-pointer overflow-hidden" onClick={onOpen}> {pinned && ( <div className="absolute left-1 top-1 z-10 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white"> <Pin size={12} /> Pinned </div> )} {post.images && post.images.length > 0 ? ( <img src={post.images[0]} alt={post.content || "post"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> ) : ( <div className="w-full h-full flex items-center justify-center p-2 text-xs text-center text-muted-foreground"> {post.content} </div> )}

{isOwnProfile && (
    <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full">
            <MoreHorizontal size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!pinned ? (
            <DropdownMenuItem onClick={() => onPinToggle?.(true)}><Pin className="mr-2 h-4 w-4" /> Pin to profile</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onPinToggle?.(false)}><PinOff className="mr-2 h-4 w-4" /> Unpin</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )}
</div>

); };

export default UserProfile;

      navigate("/auth");
      return;
    }
    
    const loadUserData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const [profileData, postsData, followersData, followingData] = await Promise.all([
          getProfileById(userId),
          getPosts(),
          getFollowers(userId),
          getFollowing(userId)
        ]);
        
        if (profileData) {
          setProfileUser(profileData);
          
          // Filter posts for this user
          const myPosts = postsData.filter(post => post.user_id === userId);
          setUserPosts(myPosts);
          
          setFollowers(followersData);
          setFollowing(followingData);
          
          // Check if current user is following this profile
          const isCurrentlyFollowing = followersData.some(f => f.follower_id === user.id);
          setIsFollowing(isCurrentlyFollowing);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [userId, user, navigate, toast]);

  const handleFollowToggle = async () => {
    if (!user || !profileUser) return;

    try {
      if (isFollowing) {
        await unfollowUser(profileUser.user_id);
        setIsFollowing(false);
        setFollowers(prev => prev.filter(f => f.follower_id !== user.id));
        toast({
          title: "Unfollowed",
          description: `You unfollowed @${profileUser.username}`,
        });
      } else {
        await followUser(profileUser.user_id);
        setIsFollowing(true);
        setFollowers(prev => [...prev, { follower_id: user.id }]);
        toast({
          title: "Following",
          description: `You are now following @${profileUser.username}`,
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    }
  };

  const handleMessage = () => {
    // Navigate to messages with user parameter
    navigate(`/messages/chat/${profileUser?.user_id}`);
  };

  if (!user || !profile || loading || !profileUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isOwnProfile = user.id === profileUser.user_id;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground hover:text-primary"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">{profileUser.username}</h1>
              {profileUser.is_verified && (
                <Badge variant="secondary" className="bg-primary text-primary-foreground h-5 w-5 p-0 rounded-full flex items-center justify-center">
                  ✓
                </Badge>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-foreground hover:text-primary"
          >
            <MoreHorizontal size={20} />
          </Button>
        </div>
      </header>

      {/* Profile Header - Instagram Style */}
      <div className="text-center py-8 space-y-4">
        {/* Profile Picture */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src={profileUser.avatar_url} className="object-cover" />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-4xl font-bold">
                {(profileUser.full_name || profileUser.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Username and Verification */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-foreground font-inter">{profileUser.username}</h1>
            {profileUser.is_verified && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">✓</span>
              </div>
            )}
          </div>
          {profileUser.full_name && (
            <p className="text-muted-foreground font-medium">{profileUser.full_name}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{userPosts.length}</div>
            <div className="text-sm text-muted-foreground font-medium">Posts</div>
          </div>
          <button 
            className="text-center hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/user/${profileUser.user_id}/followers`)}
          >
            <div className="text-2xl font-bold text-foreground">{followers.length}</div>
            <div className="text-sm text-muted-foreground font-medium">Followers</div>
          </button>
          <button 
            className="text-center hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/user/${profileUser.user_id}/following`)}
          >
            <div className="text-2xl font-bold text-foreground">{following.length}</div>
            <div className="text-sm text-muted-foreground font-medium">Following</div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="px-8 space-y-3">
          {isOwnProfile ? (
            <Button 
              variant="secondary" 
              className="w-full rounded-xl h-12 font-semibold"
              onClick={() => navigate("/profile")}
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={handleFollowToggle}
                className={`flex-1 rounded-xl h-12 font-semibold ${
                  isFollowing 
                    ? 'bg-muted text-foreground hover:bg-muted/80' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1 rounded-xl h-12 font-semibold"
                onClick={handleMessage}
              >
                Message
              </Button>
            </div>
          )}
          
          {profileUser.bio && (
            <p className="text-sm text-foreground text-center px-4 leading-relaxed">
              {profileUser.bio}
            </p>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="border-t border-border">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent border-b-0 h-auto p-0">
            <TabsTrigger 
              value="posts" 
              className="flex items-center justify-center gap-2 py-4 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none bg-transparent"
            >
              <Grid size={20} />
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="flex items-center justify-center gap-2 py-4 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none bg-transparent"
            >
              <Bookmark size={20} />
            </TabsTrigger>
            <TabsTrigger 
              value="liked" 
              className="flex items-center justify-center gap-2 py-4 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none bg-transparent"
            >
              <Heart size={20} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {userPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 border-2 border-foreground rounded-full flex items-center justify-center mb-6">
                  <Grid size={32} className="text-foreground" />
                </div>
                <h3 className="text-xl font-light text-foreground mb-2">No Posts Yet</h3>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 p-1">
                {userPosts.map(post => (
                  <div 
                    key={post.id} 
                    className="aspect-square bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    {post.images && post.images.length > 0 ? (
                      <img 
                        src={post.images[0]} 
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <p className="text-xs text-center text-muted-foreground p-2 line-clamp-3">
                          {post.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 border-2 border-foreground rounded-full flex items-center justify-center mb-6">
                <Bookmark size={32} className="text-foreground" />
              </div>
              <h3 className="text-xl font-light text-foreground mb-2">No Saved Posts</h3>
            </div>
          </TabsContent>

          <TabsContent value="liked" className="mt-0">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 border-2 border-foreground rounded-full flex items-center justify-center mb-6">
                <Heart size={32} className="text-foreground" />
              </div>
              <h3 className="text-xl font-light text-foreground mb-2">No Liked Posts</h3>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;

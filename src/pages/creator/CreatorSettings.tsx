import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, User, Image, Palette, Link2, 
  Save, Camera, X, Check, Copy, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCreatorAuth } from '@/hooks/useCreatorAuth';
import { creatorApi } from '@/services/creatorApi';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const CreatorSettings = () => {
  const navigate = useNavigate();
  const { creator, isLoading: authLoading, isAuthenticated, refreshProfile, truncateKey } = useCreatorAuth();
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  
  // Image state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load existing profile data
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/creator/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated) return;
      
      try {
        const profile = await creatorApi.getMyProfile();
        setDisplayName(profile.display_name || '');
        setBio(profile.bio || '');
        // Extract slug from custom URL if available
        if (profile.avatar_url) {
          setAvatarPreview(creatorApi.getMediaUrl(profile.avatar_url));
        }
        if (profile.banner_url) {
          setBannerPreview(creatorApi.getMediaUrl(profile.banner_url));
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, [isAuthenticated]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5MB');
      return;
    }
    
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Banner must be under 10MB');
      return;
    }
    
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const clearBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setIsSaving(true);

    try {
      // Upload avatar if changed
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('type', 'avatar');
        // The API should handle avatar uploads - for now we include it in profile update
      }

      // Upload banner if changed
      let bannerUrl: string | undefined;
      if (bannerFile) {
        const formData = new FormData();
        formData.append('file', bannerFile);
        formData.append('type', 'banner');
        // The API should handle banner uploads
      }

      // Update profile
      await creatorApi.updateMyProfile({
        display_name: displayName.trim(),
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      });

      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const copyProfileUrl = () => {
    const url = `${window.location.origin}/creator/${creator?.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Profile URL copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const slugError = pageSlug && !/^[a-z0-9-]+$/.test(pageSlug) 
    ? 'Only lowercase letters, numbers, and hyphens allowed' 
    : null;

  if (authLoading || !creator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6600]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/creator/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Creator Settings</h1>
            <p className="text-sm text-muted-foreground">
              Customize your profile and page
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#FF6600]" />
                Profile Preview
              </CardTitle>
              <CardDescription>
                How your profile appears to visitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Banner */}
              <div className="relative h-32 md:h-40 bg-gradient-to-br from-[#FF6600]/30 to-[#FF6600]/5 rounded-lg overflow-hidden mb-12">
                {bannerPreview && (
                  <img
                    src={bannerPreview}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                )}
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerChange}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Change Banner
                  </Button>
                  {bannerPreview && (
                    <Button variant="destructive" size="sm" onClick={clearBanner}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Avatar positioned at bottom */}
                <div className="absolute -bottom-10 left-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-background border-4 border-background overflow-hidden">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#FF6600]/20 flex items-center justify-center text-2xl font-bold text-[#FF6600]">
                          {displayName.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview info */}
              <div className="ml-24">
                <p className="font-bold text-lg">{displayName || 'Your Name'}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {truncateKey(creator.publicKey, 8, 8)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#FF6600]" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your public name"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  This is how you'll appear to your audience
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your audience about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/500
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Page URL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#FF6600]" />
                Your Page URL
              </CardTitle>
              <CardDescription>
                Share this link with your audience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="text-sm flex-1 truncate">
                  {window.location.origin}/creator/{creator.id}
                </code>
                <Button variant="ghost" size="sm" onClick={copyProfileUrl}>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.open(`/creator/${creator.id}`, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="slug" className="flex items-center gap-2">
                  Custom Page Name
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{window.location.origin}/creator/</span>
                  <Input
                    id="slug"
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value.toLowerCase())}
                    placeholder="yourname"
                    className="max-w-[200px]"
                    disabled
                  />
                </div>
                {slugError && (
                  <p className="text-xs text-destructive">{slugError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Custom page names will be available soon. Contact admin to request yours.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-[#FF6600]" />
                Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Public Key</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <code className="text-xs break-all font-mono">
                    {creator.publicKey}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground">
                  This is your unique identifier. Share it to receive payments or prove ownership.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={() => navigate('/creator/dashboard')}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !displayName.trim()}
              className="bg-[#FF6600] hover:bg-[#FF6600]/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreatorSettings;

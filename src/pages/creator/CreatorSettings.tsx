import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, User, Image, Palette, Link2, 
  Save, Camera, X, Check, Copy, ExternalLink, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useCreatorAuth } from '@/hooks/useCreatorAuth';
import { useCreatorSettings } from '@/hooks/useCreatorSettings';
import { creatorApi } from '@/services/creatorApi';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const CreatorSettings = () => {
  const navigate = useNavigate();
  const { creator, isLoading: authLoading, isAuthenticated, refreshProfile, truncateKey } = useCreatorAuth();
  const { settings, updateMessageFee, toggleNonSubMessages } = useCreatorSettings(creator?.id);
  
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
  const [uiMessage, setUiMessage] = useState<string | null>(null);

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
      setUiMessage('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUiMessage('Avatar must be under 5MB');
      return;
    }

    setUiMessage(null);
    
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setUiMessage('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUiMessage('Banner must be under 10MB');
      return;
    }

    setUiMessage(null);
    
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
      setUiMessage('Display name is required');
      return;
    }

    setUiMessage(null);

    setIsSaving(true);

    try {
      // Upload avatar if changed
      let avatarUrl: string | undefined;
      let avatarUploadError: string | null = null;
      if (avatarFile) {
        try {
          setUiMessage('Uploading avatar...');
          const result = await creatorApi.uploadProfileImage(avatarFile, 'avatar');
          // __attached__ means the image was uploaded but we don't get a URL back
          // The refresh will pick it up
          if (result && result !== '__attached__') {
            avatarUrl = result;
          }
        } catch (error) {
          console.error('Avatar upload failed:', error);
          avatarUploadError = error instanceof Error ? error.message : 'Avatar upload failed';
        }
      }

      // Upload banner if changed
      let bannerUrl: string | undefined;
      let bannerUploadError: string | null = null;
      if (bannerFile) {
        try {
          setUiMessage('Uploading banner...');
          const result = await creatorApi.uploadProfileImage(bannerFile, 'banner');
          if (result && result !== '__attached__') {
            bannerUrl = result;
          }
        } catch (error) {
          console.error('Banner upload failed:', error);
          bannerUploadError = error instanceof Error ? error.message : 'Banner upload failed';
        }
      }

      setUiMessage('Saving profile...');

      // Update profile - only send avatar/banner if we got new URLs
      const updatePayload: Parameters<typeof creatorApi.updateMyProfile>[0] = {
        display_name: displayName.trim(),
        bio: bio.trim() || undefined,
      };
      if (avatarUrl) updatePayload.avatar_url = avatarUrl;
      if (bannerUrl) updatePayload.banner_url = bannerUrl;
      
      await creatorApi.updateMyProfile(updatePayload);

      await refreshProfile();
      
      // Build success/warning message
      const errors = [avatarUploadError, bannerUploadError].filter(Boolean);
      if (errors.length > 0) {
        setUiMessage(`Profile saved. Note: ${errors.join('. ')}`);
      } else {
        setUiMessage('Profile updated successfully!');
      }
      
      // Clear file state after successful save
      setAvatarFile(null);
      setBannerFile(null);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setUiMessage(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const copyProfileUrl = () => {
    const url = `${window.location.origin}/creator/${creator?.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setUiMessage('Profile URL copied.');
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
        <div className="flex items-center gap-4 mb-4">
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

        {uiMessage && (
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground flex items-center justify-between">
            <span>{uiMessage}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setUiMessage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

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
                    {/* Make the entire avatar clickable on mobile */}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-20 h-20 md:w-20 md:h-20 rounded-full bg-background border-4 border-background overflow-hidden cursor-pointer touch-manipulation active:scale-95 transition-transform"
                    >
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
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    {/* Camera icon overlay - always visible on mobile */}
                    <div 
                      className="absolute -bottom-1 -right-1 w-8 h-8 md:w-7 md:h-7 rounded-full bg-secondary flex items-center justify-center pointer-events-none"
                    >
                      <Camera className="w-4 h-4 md:w-3 md:h-3" />
                    </div>
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

          {/* Messaging Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#FF6600]" />
                Messaging Settings
              </CardTitle>
              <CardDescription>
                Configure how non-subscribers can message you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Allow pay-per-message toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="allowMessages">Allow Pay-per-Message</Label>
                  <p className="text-xs text-muted-foreground">
                    Let non-subscribers send you messages for a small fee
                  </p>
                </div>
                <Switch
                  id="allowMessages"
                  checked={settings.allowNonSubMessages}
                  onCheckedChange={toggleNonSubMessages}
                />
              </div>

              {/* Message fee */}
              {settings.allowNonSubMessages && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="messageFee">Message Fee (XMR)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="messageFee"
                        type="number"
                        value={settings.messageFeeXmr}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            updateMessageFee(val);
                          }
                        }}
                        min="0.001"
                        step="0.001"
                        className="max-w-[150px]"
                      />
                      <span className="text-sm text-muted-foreground">XMR per message</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Suggested: 0.01 XMR (~$1.50). Set higher to filter low-effort messages.
                    </p>
                  </div>

                  {/* Preview */}
                  <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                    <p className="text-xs text-muted-foreground mb-1">Non-subscribers will see:</p>
                    <p className="text-sm">
                      "Send a message for <span className="font-bold text-[#FF6600]">{settings.messageFeeXmr} XMR</span>"
                    </p>
                  </div>
                </>
              )}
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

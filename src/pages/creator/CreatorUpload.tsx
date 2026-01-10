import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, ImageIcon, Film, Loader2, ArrowLeft, 
  X, Check, DollarSign, Tag, AlertCircle, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useCreatorAuth } from '@/hooks/useCreatorAuth';
import { creatorApi } from '@/services/creatorApi';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { optimizeImage, isCompressibleImage } from '@/lib/imageCompression';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];

const CreatorUpload = () => {
  const navigate = useNavigate();
  const { creator, isLoading: authLoading, isAuthenticated, refreshProfile } = useCreatorAuth();
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressionSavings, setCompressionSavings] = useState<number | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('0.01');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uiError, setUiError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/creator/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, MP4, WebM, MOV';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 100MB';
    }
    return null;
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      console.warn('[CreatorUpload] File validation failed:', error);
      setUiError(error);
      return;
    }

    setUiError(null);
    setOriginalFile(selectedFile);
    setCompressionSavings(null);

    // Compress images before upload
    if (isCompressibleImage(selectedFile)) {
      setIsCompressing(true);
      try {
        const result = await optimizeImage(selectedFile);
        setFile(result.file);
        
        if (result.compressionRatio < 1) {
          const savings = Math.round((1 - result.compressionRatio) * 100);
          setCompressionSavings(savings);
        }

        // Generate preview from compressed file
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(result.file);
      } catch (err) {
        console.error('[CreatorUpload] Compression failed:', err);
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      } finally {
        setIsCompressing(false);
      }
    } else {
      // Videos and GIFs - no compression
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setOriginalFile(null);
    setPreview(null);
    setCompressionSavings(null);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      const msg = 'Please provide a file and title';
      console.warn('[CreatorUpload]', msg);
      setUiError(msg);
      return;
    }

    setUiError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('tier', isPaid ? 'paid' : 'free');
      if (isPaid) formData.append('price_xmr', price);
      if (tags.length > 0) formData.append('tags', tags.join(','));

      setUploadProgress(30);

      const content = await creatorApi.uploadContent(formData);

      setUploadProgress(100);
      console.log('[CreatorUpload] Upload successful:', content.id);
      refreshProfile();

      // Navigate to the content or dashboard
      navigate(`/content/${content.id}`);
    } catch (error) {
      console.error('Upload failed:', error);
      setUiError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isVideo = file?.type.startsWith('video/');
  const canSubmit = file && title.trim() && (!isPaid || (parseFloat(price) >= 0.001));

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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/creator/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Upload Content</h1>
            <p className="text-sm text-muted-foreground">
              Share your content with your audience
            </p>
          </div>
        </div>

        {uiError && (
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            {uiError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Zone */}
          <div className="space-y-6">
            {!file ? (
              <Card
                className={`border-2 border-dashed transition-colors ${
                  isDragging 
                    ? 'border-[#FF6600] bg-[#FF6600]/5' 
                    : 'border-border hover:border-[#FF6600]/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <CardContent className="py-16">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept={ALLOWED_TYPES.join(',')}
                    onChange={handleInputChange}
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-full bg-[#FF6600]/10 flex items-center justify-center mb-4">
                      <Upload className="w-10 h-10 text-[#FF6600]" />
                    </div>
                    <p className="text-lg font-medium mb-2">
                      Drop your file here
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to browse
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" />
                        Images
                      </span>
                      <span className="flex items-center gap-1">
                        <Film className="w-4 h-4" />
                        Videos
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Max 100MB • JPG, PNG, GIF, WebP, MP4, WebM
                    </p>
                  </label>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="relative">
                  {isVideo ? (
                    <video
                      src={preview || undefined}
                      className="w-full aspect-video object-contain bg-black"
                      controls
                    />
                  ) : (
                    <img
                      src={preview || undefined}
                      alt="Preview"
                      className="w-full aspect-video object-contain bg-muted"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{file.name}</span>
                    <div className="flex items-center gap-2">
                      {compressionSavings !== null && compressionSavings > 0 && (
                        <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                          <Zap className="w-3 h-3 mr-1" />
                          {compressionSavings}% smaller
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </Badge>
                    </div>
                  </div>
                  {originalFile && compressionSavings !== null && compressionSavings > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Original: {(originalFile.size / (1024 * 1024)).toFixed(1)} MB → Optimized: {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Compression Progress */}
            {isCompressing && (
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <Zap className="w-5 h-5 animate-pulse text-[#FF6600]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Optimizing image...</p>
                      <p className="text-xs text-muted-foreground">Reducing file size for faster upload</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF6600]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Uploading...</p>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {uploadProgress}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your content a catchy title"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {title.length}/100
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your content..."
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {description.length}/500
                  </p>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags (up to 5)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Add a tag..."
                      disabled={tags.length >= 5}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addTag}
                      disabled={!tagInput.trim() || tags.length >= 5}
                    >
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeTag(tag)}
                        >
                          {tag}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#FF6600]" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Paid Content</p>
                    <p className="text-sm text-muted-foreground">
                      Require payment to view full content
                    </p>
                  </div>
                  <Switch
                    checked={isPaid}
                    onCheckedChange={setIsPaid}
                  />
                </div>

                {isPaid && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="price">Price (XMR)</Label>
                    <div className="relative">
                      <Input
                        id="price"
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        XMR
                      </span>
                    </div>
                    {parseFloat(price) < 0.001 && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Minimum price is 0.001 XMR
                      </p>
                    )}
                  </div>
                )}

                {!isPaid && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-sm text-green-400 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Free content is visible to everyone
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              onClick={handleUpload}
              disabled={!canSubmit || isUploading}
              className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Content
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

export default CreatorUpload;

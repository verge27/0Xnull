import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader2, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { creatorApi, ContentItem } from '@/services/creatorApi';

interface CreatorUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (content: ContentItem) => void;
}

type PostType = 'media' | 'text';

const CreatorUploadModal = ({ open, onOpenChange, onSuccess }: CreatorUploadModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  const [postType, setPostType] = useState<PostType>('media');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const resetForm = () => {
    setPostType('media');
    setFile(null);
    setPreview(null);
    setThumbnail(null);
    setThumbnailPreview(null);
    setTitle('');
    setDescription('');
    setIsPaid(false);
    setPrice('');
    setTags('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      setUiError('Only images and videos are allowed');
      console.warn('[CreatorUploadModal] Invalid file type');
      return;
    }

    // Validate file size (max 100MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setUiError('File size must be less than 100MB');
      console.warn('[CreatorUploadModal] File too large');
      return;
    }

    setUiError(null);

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type - only images for thumbnails
    if (!selectedFile.type.startsWith('image/')) {
      setUiError('Thumbnail must be an image');
      return;
    }

    // Validate file size (max 10MB for thumbnails)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUiError('Thumbnail must be less than 10MB');
      return;
    }

    setUiError(null);
    setThumbnail(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(droppedFile);
        input.files = dt.files;
        handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleUpload = async () => {
    // For text posts, description is required; for media, file is required
    if (postType === 'text') {
      if (!description.trim()) {
        setUiError('Post content is required');
        return;
      }
    } else {
      if (!file) {
        setUiError('Please select a file');
        return;
      }
      if (!title.trim()) {
        setUiError('Title is required');
        return;
      }
    }

    if (isPaid && (!price || parseFloat(price) <= 0)) {
      setUiError('Please enter a valid price');
      return;
    }

    setUiError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      
      if (postType === 'text') {
        // For text posts, we create a tiny placeholder or use a special marker
        // The API might need a file, so we create a text blob
        const textBlob = new Blob(['text-post'], { type: 'text/plain' });
        formData.append('file', textBlob, 'text-post.txt');
        formData.append('post_type', 'text');
        formData.append('title', title.trim() || 'Text Post');
        formData.append('description', description.trim());
      } else {
        formData.append('file', file!);
        formData.append('title', title.trim());
        if (description.trim()) formData.append('description', description.trim());
      }
      
      formData.append('tier', isPaid ? 'paid' : 'free');
      if (isPaid) formData.append('price_xmr', price);
      if (tags.trim()) formData.append('tags', tags.trim());
      if (thumbnail && postType === 'media') formData.append('thumbnail', thumbnail);

      const content = await creatorApi.uploadContent(formData);
      console.log('[CreatorUploadModal] Upload successful:', content.id);
      
      // Mark as text post for local display
      if (postType === 'text') {
        content.post_type = 'text';
        content.media_type = 'text/post';
      }
      
      onSuccess(content);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Upload failed:', error);
      setUiError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const isVideo = file?.type.startsWith('video/');

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isUploading) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share content with your audience
          </DialogDescription>
        </DialogHeader>

        <Tabs value={postType} onValueChange={(v) => setPostType(v as PostType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="media" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <FileText className="w-4 h-4" />
              Text Post
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4 mt-4">
            {uiError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {uiError}
              </div>
            )}

            <TabsContent value="media" className="mt-0 space-y-4">
              {/* File Upload */}
              {!file ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-[#FF6600]/50 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium">Drop file here or click to upload</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Images and videos up to 100MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    {isVideo ? (
                      <video src={preview!} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={preview!} alt="Preview" className="w-full h-full object-contain" />
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => { setFile(null); setPreview(null); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs">
                    {isVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    {file.name}
                  </div>
                </div>
              )}

              {/* Thumbnail Upload - only show for videos */}
              {isVideo && file && (
                <div className="space-y-2">
                  <Label>Thumbnail (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Upload a custom thumbnail for your video
                  </p>
                  {!thumbnailPreview ? (
                    <div
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-[#FF6600]/50 transition-colors"
                    >
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailSelect}
                        className="hidden"
                      />
                      <ImageIcon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm">Click to add thumbnail</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted max-w-[200px]">
                        <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => { setThumbnail(null); setThumbnailPreview(null); }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Title for media */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your content a title"
                  maxLength={100}
                />
              </div>

              {/* Description for media */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-0 space-y-4">
              {/* Title for text post (optional) */}
              <div className="space-y-2">
                <Label htmlFor="text-title">Title (optional)</Label>
                <Input
                  id="text-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Optional headline..."
                  maxLength={100}
                />
              </div>

              {/* Main content for text post */}
              <div className="space-y-2">
                <Label htmlFor="text-content">Post Content *</Label>
                <Textarea
                  id="text-content"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share an update, announcement, or message with your subscribers..."
                  rows={6}
                  maxLength={2000}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/2000
                </p>
              </div>
            </TabsContent>

            {/* Common fields for both types */}
            {/* Paid Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <Label htmlFor="paid">Paid Content</Label>
                <p className="text-xs text-muted-foreground">
                  Require payment to unlock
                </p>
              </div>
              <Switch
                id="paid"
                checked={isPaid}
                onCheckedChange={setIsPaid}
              />
            </div>

            {/* Price Input */}
            {isPaid && (
              <div className="space-y-2">
                <Label htmlFor="price">Price (XMR)</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.01"
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    XMR
                  </span>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="update, announcement, exclusive (comma separated)"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={
                  isUploading || 
                  (postType === 'media' && (!file || !title.trim())) ||
                  (postType === 'text' && !description.trim())
                }
                className="flex-1 bg-[#FF6600] hover:bg-[#FF6600]/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {postType === 'text' ? 'Posting...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    {postType === 'text' ? (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Post
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorUploadModal;

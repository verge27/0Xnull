import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { X, Loader2, ImagePlus, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePrivateKeyAuth } from '@/hooks/usePrivateKeyAuth';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUpload = ({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) => {
  const { user } = useAuth();
  const { privateKeyUser, storedPrivateKey } = usePrivateKeyAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPkUser = !!privateKeyUser && !user;

  // Upload for private key users via edge function
  const uploadImagePk = async (file: File, retryCount = 0): Promise<string | null> => {
    const MAX_RETRIES = 2;
    
    if (!storedPrivateKey) {
      console.error('[ImageUpload] No private key available');
      toast.error('Private key required for upload');
      return null;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    if (!fileExt || !allowedExts.includes(fileExt)) {
      toast.error('Invalid file type. Use JPG, PNG, WebP, or GIF');
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('privateKey', storedPrivateKey);
      formData.append('file', file);
      formData.append('action', 'upload');

      const { data, error } = await supabase.functions.invoke('pk-image-upload', {
        body: formData,
      });

      if (error) {
        console.error('[ImageUpload] PK upload error:', error);
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return uploadImagePk(file, retryCount + 1);
        }
        setUploadError(`Upload failed: ${error.message}`);
        toast.error(`Failed to upload image: ${error.message}`);
        return null;
      }

      if (data?.error) {
        setUploadError(data.error);
        toast.error(data.error);
        return null;
      }

      console.log('[ImageUpload] PK upload successful:', data.url);
      return data.url;
    } catch (err: any) {
      console.error('[ImageUpload] PK unexpected error:', err);
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return uploadImagePk(file, retryCount + 1);
      }
      setUploadError(`Unexpected error: ${err.message}`);
      toast.error('An unexpected error occurred during upload');
      return null;
    }
  };

  // Upload for regular auth users
  const uploadImage = async (file: File, retryCount = 0): Promise<string | null> => {
    const MAX_RETRIES = 2;
    
    if (!user) {
      console.error('[ImageUpload] No user logged in');
      toast.error('You must be logged in to upload images');
      return null;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    if (!fileExt || !allowedExts.includes(fileExt)) {
      console.error('[ImageUpload] Invalid file type:', fileExt);
      toast.error('Invalid file type. Use JPG, PNG, WebP, or GIF');
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error('[ImageUpload] File too large:', file.size);
      toast.error('File too large. Max 5MB');
      return null;
    }

    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    console.log('[ImageUpload] Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);

    try {
      const { data, error } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[ImageUpload] Storage upload error:', error);
        
        if (retryCount < MAX_RETRIES && (error.message?.includes('network') || error.message?.includes('timeout'))) {
          console.log('[ImageUpload] Retrying upload, attempt:', retryCount + 1);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return uploadImage(file, retryCount + 1);
        }
        
        setUploadError(`Upload failed: ${error.message}`);
        toast.error(`Failed to upload image: ${error.message}`);
        return null;
      }

      console.log('[ImageUpload] Upload successful:', data);

      const { data: urlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(data.path);

      console.log('[ImageUpload] Public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (err: any) {
      console.error('[ImageUpload] Unexpected error:', err);
      
      if (retryCount < MAX_RETRIES) {
        console.log('[ImageUpload] Retrying after error, attempt:', retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return uploadImage(file, retryCount + 1);
      }
      
      setUploadError(`Unexpected error: ${err.message}`);
      toast.error('An unexpected error occurred during upload');
      return null;
    }
  };

  const doUpload = isPkUser ? uploadImagePk : uploadImage;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setFailedFiles([]);

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    console.log('[ImageUpload] Starting upload of', filesToUpload.length, 'files, isPkUser:', isPkUser);
    setUploading(true);

    const uploadedUrls: string[] = [];
    const failed: File[] = [];
    
    for (const file of filesToUpload) {
      const url = await doUpload(file);
      if (url) {
        uploadedUrls.push(url);
      } else {
        failed.push(file);
      }
    }

    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    }
    
    if (failed.length > 0) {
      setFailedFiles(failed);
      console.error('[ImageUpload] Failed to upload', failed.length, 'files');
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const retryFailedUploads = async () => {
    if (failedFiles.length === 0) return;
    
    console.log('[ImageUpload] Retrying', failedFiles.length, 'failed uploads');
    setUploading(true);
    setUploadError(null);
    
    const uploadedUrls: string[] = [];
    const stillFailed: File[] = [];
    
    for (const file of failedFiles) {
      const url = await doUpload(file);
      if (url) {
        uploadedUrls.push(url);
      } else {
        stillFailed.push(file);
      }
    }

    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    }
    
    setFailedFiles(stillFailed);
    setUploading(false);
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    // Try to delete from storage
    try {
      const path = imageUrl.split('/listing-images/')[1];
      if (path) {
        console.log('[ImageUpload] Deleting image from storage:', path);
        
        // PK users use edge function for delete
        if (isPkUser && storedPrivateKey) {
          const formData = new FormData();
          formData.append('privateKey', storedPrivateKey);
          formData.append('action', 'delete');
          formData.append('filePath', path);
          
          const { error } = await supabase.functions.invoke('pk-image-upload', {
            body: formData,
          });
          if (error) {
            console.error('[ImageUpload] PK delete error:', error);
          }
        } else {
          const { error } = await supabase.storage.from('listing-images').remove([path]);
          if (error) {
            console.error('[ImageUpload] Failed to delete from storage:', error);
          }
        }
      }
    } catch (err) {
      console.error('[ImageUpload] Failed to delete image from storage:', err);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Product Images (max {maxImages})</Label>
      
      {/* Error Display */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
      
      {/* Failed uploads retry */}
      {failedFiles.length > 0 && !uploading && (
        <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <span className="text-sm text-amber-600 dark:text-amber-400">
            {failedFiles.length} image(s) failed to upload
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={retryFailedUploads}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}
      
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('[ImageUpload] Image failed to load:', url);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {images.length < maxImages && (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors ${
            uploading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:border-primary'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload images
              </span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG, WebP, GIF • Max 5MB each
              </span>
            </div>
          )}
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

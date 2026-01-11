import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, ImageIcon, Film, Loader2, ArrowLeft, 
  X, Check, DollarSign, Tag, AlertCircle, Zap, RefreshCw, Clock, Image as ImageIcon2,
  Calendar, Plus, Trash2, CheckCircle2, XCircle, Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useCreatorAuth } from '@/hooks/useCreatorAuth';
import { creatorApi } from '@/services/creatorApi';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { optimizeImage, isCompressibleImage, IMAGE_QUALITY_PRESETS, type CompressionQuality } from '@/lib/imageCompression';
import { optimizeVideo, isCompressibleVideo, VIDEO_QUALITY_PRESETS, type VideoCompressionProgress } from '@/lib/videoCompression';
import { extractVideoThumbnail, getVideoDuration } from '@/lib/videoThumbnail';
import { withRetry, createProgressTracker, type UploadProgress } from '@/lib/uploadRetry';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const WARN_FILE_SIZE = 50 * 1024 * 1024; // 50MB - warn about potential server limits
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
const MAX_UPLOAD_ATTEMPTS = 3;
const MAX_BULK_FILES = 10;

interface BulkFileItem {
  id: string;
  file: File;
  processedFile: File | null;
  preview: string | null;
  status: 'pending' | 'processing' | 'ready' | 'uploading' | 'done' | 'error';
  error?: string;
  compressionSavings?: number;
}

const CreatorUpload = () => {
  const navigate = useNavigate();
  const { creator, isLoading: authLoading, isAuthenticated, refreshProfile } = useCreatorAuth();
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [compressionSavings, setCompressionSavings] = useState<number | null>(null);
  const [skipCompression, setSkipCompression] = useState(false);
  const [compressionQuality, setCompressionQuality] = useState<CompressionQuality>('medium');
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [thumbnailTime, setThumbnailTime] = useState<number>(1);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('0.01');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Bulk upload state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<BulkFileItem[]>([]);
  const [bulkUploadProgress, setBulkUploadProgress] = useState({ current: 0, total: 0 });
  
  // Upload state with retry tracking
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<VideoCompressionProgress | null>(null);
  const [uploadState, setUploadState] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
    attempt: 1,
    maxAttempts: MAX_UPLOAD_ATTEMPTS,
  });
  const [uiError, setUiError] = useState<string | null>(null);
  const [testUploadStatus, setTestUploadStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testUploadMessage, setTestUploadMessage] = useState<string | null>(null);

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

  const validateFile = (file: File): { error: string | null; warning: string | null } => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, MP4, WebM, MOV', warning: null };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { error: 'File too large. Maximum size is 100MB', warning: null };
    }
    // Warn about files that might exceed server limits
    if (file.size > WARN_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return { 
        error: null, 
        warning: `Large file (${sizeMB}MB). If upload fails, try compressing the file first.` 
      };
    }
    return { error: null, warning: null };
  };

  // State for file size warning
  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (
    selectedFile: File, 
    forceSkipCompression = false,
    qualityOverride?: CompressionQuality
  ) => {
    const { error, warning } = validateFile(selectedFile);
    if (error) {
      console.warn('[CreatorUpload] File validation failed:', error);
      setUiError(error);
      return;
    }
    
    // Set warning but allow upload to proceed
    setFileSizeWarning(warning);

    // Use quality override if provided, otherwise use current state
    const quality = qualityOverride ?? compressionQuality;

    setUiError(null);
    setOriginalFile(selectedFile);
    setCompressionSavings(null);
    setCompressionProgress(null);
    setVideoDuration(null);
    setThumbnailTime(1);

    const shouldSkip = forceSkipCompression || skipCompression;

    // Get video duration for timeline
    if (isCompressibleVideo(selectedFile)) {
      try {
        const duration = await getVideoDuration(selectedFile);
        setVideoDuration(duration);
      } catch (err) {
        console.warn('[CreatorUpload] Failed to get video duration:', err);
      }
    }

    // Skip compression if toggle is enabled
    if (shouldSkip) {
      setFile(selectedFile);
      
      // Still generate thumbnail for videos
      if (isCompressibleVideo(selectedFile)) {
        try {
          const thumbnail = await extractVideoThumbnail(selectedFile, { time: 1 });
          setVideoThumbnail(thumbnail.dataUrl);
          setPreview(thumbnail.dataUrl);
        } catch {
          const reader = new FileReader();
          reader.onload = (e) => setPreview(e.target?.result as string);
          reader.readAsDataURL(selectedFile);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      }
      return;
    }

    // Compress images before upload
    if (isCompressibleImage(selectedFile)) {
      setIsCompressing(true);
      
      // Generate early preview from original file so user sees something immediately
      const earlyPreviewReader = new FileReader();
      earlyPreviewReader.onload = (e) => {
        // Only set if we don't have a preview yet
        setPreview((prev) => prev ?? (e.target?.result as string));
      };
      earlyPreviewReader.readAsDataURL(selectedFile);
      
      try {
        const result = await optimizeImage(selectedFile, { preset: quality });
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
        console.error('[CreatorUpload] Image compression failed:', err);
        setFile(selectedFile);
        // Preview was already set above, no need to re-read
      } finally {
        setIsCompressing(false);
      }
    } else if (isCompressibleVideo(selectedFile)) {
      // Compress videos before upload
      setIsCompressing(true);
      setVideoThumbnail(null);
      
      // Generate early thumbnail from original so user sees something immediately
      extractVideoThumbnail(selectedFile, { time: 1 })
        .then((thumb) => {
          // Only set if we don't have thumbnails yet
          setVideoThumbnail((prev) => prev ?? thumb.dataUrl);
          setPreview((prev) => prev ?? thumb.dataUrl);
        })
        .catch(() => {
          // Fallback: just generate data URL preview
          const reader = new FileReader();
          reader.onload = (e) => setPreview((prev) => prev ?? (e.target?.result as string));
          reader.readAsDataURL(selectedFile);
        });
      
      try {
        const result = await optimizeVideo(selectedFile, {
          preset: quality,
          onProgress: setCompressionProgress,
        });
        setFile(result.file);
        
        if (result.compressionRatio < 1) {
          const savings = Math.round((1 - result.compressionRatio) * 100);
          setCompressionSavings(savings);
        }

        // Generate thumbnail from the video for better preview
        try {
          const thumbnail = await extractVideoThumbnail(result.file, { time: 1 });
          setVideoThumbnail(thumbnail.dataUrl);
          setPreview(thumbnail.dataUrl);
        } catch (thumbErr) {
          console.warn('[CreatorUpload] Thumbnail extraction failed:', thumbErr);
          // Keep the early preview we generated
        }
      } catch (err) {
        console.error('[CreatorUpload] Video compression failed:', err);
        setFile(selectedFile);
        // Keep the early preview/thumbnail we generated above
      } finally {
        setIsCompressing(false);
        setCompressionProgress(null);
      }
    } else {
      // GIFs and unsupported formats - no compression
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  }, [skipCompression, compressionQuality]);

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
    setVideoThumbnail(null);
    setCompressionSavings(null);
    setVideoDuration(null);
    setThumbnailTime(1);
    setFileSizeWarning(null);
  };

  // Handle thumbnail time change
  const handleThumbnailTimeChange = useCallback(async (time: number) => {
    setThumbnailTime(time);
    
    if (!originalFile || !isCompressibleVideo(originalFile)) return;
    
    setIsGeneratingThumbnail(true);
    try {
      const thumbnail = await extractVideoThumbnail(originalFile, { time });
      setVideoThumbnail(thumbnail.dataUrl);
      setPreview(thumbnail.dataUrl);
    } catch (err) {
      console.warn('[CreatorUpload] Failed to update thumbnail:', err);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  }, [originalFile]);

  // Calculate upload time estimate
  const uploadTimeEstimate = useMemo(() => {
    if (!file) return null;
    
    // Assume average upload speed of 2 Mbps (conservative estimate)
    const avgSpeedBps = 2 * 1024 * 1024 / 8; // 2 Mbps in bytes per second
    const seconds = file.size / avgSpeedBps;
    
    if (seconds < 60) {
      return `~${Math.max(1, Math.round(seconds))} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `~${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.round(seconds / 3600);
      return `~${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  }, [file]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get minimum date for scheduling (now)
  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Get scheduled datetime ISO string
  const getScheduledDateTime = (): string | null => {
    if (!isScheduled || !scheduledDate || !scheduledTime) return null;
    const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    return dateTime.toISOString();
  };

  // Bulk upload handlers
  const handleBulkFileSelect = useCallback(async (files: FileList) => {
    const newFiles: BulkFileItem[] = [];
    const remaining = MAX_BULK_FILES - bulkFiles.length;
    
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      const { error } = validateFile(file);
      if (error) {
        console.warn('[CreatorUpload] Skipping invalid file:', file.name, error);
        continue;
      }
      
      newFiles.push({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        processedFile: null,
        preview: null,
        status: 'pending',
      });
    }
    
    setBulkFiles(prev => [...prev, ...newFiles]);
    
    // Process files (compress + generate previews)
    for (const item of newFiles) {
      await processBulkFile(item);
    }
  }, [bulkFiles.length, skipCompression]);

  const processBulkFile = async (item: BulkFileItem) => {
    setBulkFiles(prev => prev.map(f => 
      f.id === item.id ? { ...f, status: 'processing' as const } : f
    ));

    try {
      let processedFile = item.file;
      let savings: number | undefined;
      let previewUrl: string | null = null;

      if (!skipCompression) {
        if (isCompressibleImage(item.file)) {
          const result = await optimizeImage(item.file);
          processedFile = result.file;
          if (result.compressionRatio < 1) {
            savings = Math.round((1 - result.compressionRatio) * 100);
          }
        } else if (isCompressibleVideo(item.file)) {
          const result = await optimizeVideo(item.file);
          processedFile = result.file;
          if (result.compressionRatio < 1) {
            savings = Math.round((1 - result.compressionRatio) * 100);
          }
        }
      }

      // Generate preview
      if (item.file.type.startsWith('video/')) {
        try {
          const thumb = await extractVideoThumbnail(processedFile, { time: 1 });
          previewUrl = thumb.dataUrl;
        } catch {
          previewUrl = URL.createObjectURL(processedFile);
        }
      } else {
        previewUrl = URL.createObjectURL(processedFile);
      }

      setBulkFiles(prev => prev.map(f => 
        f.id === item.id ? { 
          ...f, 
          processedFile,
          preview: previewUrl,
          status: 'ready' as const,
          compressionSavings: savings,
        } : f
      ));
    } catch (err) {
      setBulkFiles(prev => prev.map(f => 
        f.id === item.id ? { 
          ...f, 
          status: 'error' as const,
          error: err instanceof Error ? err.message : 'Processing failed',
        } : f
      ));
    }
  };

  const removeBulkFile = (id: string) => {
    setBulkFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleBulkUpload = async () => {
    const readyFiles = bulkFiles.filter(f => f.status === 'ready');
    if (readyFiles.length === 0) {
      setUiError('No files ready for upload');
      return;
    }

    if (!title.trim()) {
      setUiError('Please provide a title template');
      return;
    }

    setUiError(null);
    setIsUploading(true);
    setBulkUploadProgress({ current: 0, total: readyFiles.length });

    let successCount = 0;
    const scheduledAt = getScheduledDateTime();

    for (let i = 0; i < readyFiles.length; i++) {
      const item = readyFiles[i];
      const fileToUpload = item.processedFile || item.file;
      
      setBulkFiles(prev => prev.map(f => 
        f.id === item.id ? { ...f, status: 'uploading' as const } : f
      ));
      setBulkUploadProgress({ current: i + 1, total: readyFiles.length });

      try {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        // Use title with index for bulk
        const itemTitle = readyFiles.length > 1 
          ? `${title.trim()} (${i + 1})` 
          : title.trim();
        formData.append('title', itemTitle);
        if (description.trim()) formData.append('description', description.trim());
        formData.append('tier', isPaid ? 'paid' : 'free');
        if (isPaid) formData.append('price_xmr', price);
        if (tags.length > 0) formData.append('tags', tags.join(','));
        if (scheduledAt) formData.append('scheduled_at', scheduledAt);

        await withRetry(
          async () => creatorApi.uploadContent(formData),
          { maxRetries: MAX_UPLOAD_ATTEMPTS - 1, baseDelayMs: 2000, maxDelayMs: 15000 }
        );

        setBulkFiles(prev => prev.map(f => 
          f.id === item.id ? { ...f, status: 'done' as const } : f
        ));
        successCount++;
      } catch (err) {
        setBulkFiles(prev => prev.map(f => 
          f.id === item.id ? { 
            ...f, 
            status: 'error' as const,
            error: err instanceof Error ? err.message : 'Upload failed',
          } : f
        ));
      }
    }

    setIsUploading(false);
    refreshProfile();

    if (successCount === readyFiles.length) {
      navigate('/creator/dashboard');
    }
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

  // Test upload function - creates a tiny 1KB test image and tries to upload
  const handleTestUpload = async () => {
    setTestUploadStatus('testing');
    setTestUploadMessage('Creating test file...');
    
    try {
      // Create a tiny 1x1 red PNG (about 70 bytes)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');
      ctx.fillStyle = '#FF6600';
      ctx.fillRect(0, 0, 1, 1);
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create test blob'));
        }, 'image/png');
      });
      
      const testFile = new File([blob], `test-upload-${Date.now()}.png`, { type: 'image/png' });
      console.log('[TestUpload] Created test file:', testFile.size, 'bytes');
      
      setTestUploadMessage(`Uploading ${testFile.size} bytes...`);
      
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('title', `Test Upload ${new Date().toISOString()}`);
      formData.append('tier', 'free');
      
      const result = await creatorApi.uploadContent(formData);
      console.log('[TestUpload] Success:', result);
      
      setTestUploadStatus('success');
      setTestUploadMessage(`Server connection OK! Test content created (ID: ${result.id?.slice(0, 8)}...)`);
      
      // Optionally delete the test content after a few seconds
      setTimeout(async () => {
        try {
          await creatorApi.deleteContent(result.id);
          console.log('[TestUpload] Cleaned up test content');
        } catch (e) {
          console.warn('[TestUpload] Could not clean up test content:', e);
        }
      }, 3000);
      
    } catch (err) {
      console.error('[TestUpload] Failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setTestUploadStatus('error');
      
      // Provide helpful context based on error
      if (errorMsg.includes('413') || errorMsg.toLowerCase().includes('too large')) {
        setTestUploadMessage(`Server error: Even tiny files are rejected. The server's upload limit may be set to 0 or misconfigured.`);
      } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
        setTestUploadMessage(`Auth error: ${errorMsg}`);
      } else {
        setTestUploadMessage(`Upload failed: ${errorMsg}`);
      }
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
    
    const progressTracker = createProgressTracker(setUploadState, MAX_UPLOAD_ATTEMPTS);
    progressTracker.uploading(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('tier', isPaid ? 'paid' : 'free');
      if (isPaid) formData.append('price_xmr', price);
      if (tags.length > 0) formData.append('tags', tags.join(','));
      
      // Add scheduled time if enabled
      const scheduledAt = getScheduledDateTime();
      if (scheduledAt) formData.append('scheduled_at', scheduledAt);

      progressTracker.uploading(30);

      // Upload with retry logic
      const content = await withRetry(
        async () => {
          progressTracker.uploading(50);
          const result = await creatorApi.uploadContent(formData);
          return result;
        },
        {
          maxRetries: MAX_UPLOAD_ATTEMPTS - 1,
          baseDelayMs: 2000,
          maxDelayMs: 15000,
          onRetry: (attempt, error, delayMs) => {
            progressTracker.retrying(attempt, error, delayMs);
          },
        }
      );

      progressTracker.success();
      console.log('[CreatorUpload] Upload successful:', content.id);
      refreshProfile();

      // Navigate to the content or dashboard
      navigate(`/content/${content.id}`);
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      progressTracker.failed(errorMsg);
      setUiError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const isVideo = file?.type.startsWith('video/');
  const canSubmit = isBulkMode 
    ? bulkFiles.some(f => f.status === 'ready') && title.trim() && (!isPaid || (parseFloat(price) >= 0.001))
    : file && title.trim() && (!isPaid || (parseFloat(price) >= 0.001));
  const bulkReadyCount = bulkFiles.filter(f => f.status === 'ready').length;
  const bulkProcessingCount = bulkFiles.filter(f => f.status === 'processing' || f.status === 'pending').length;

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/creator/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Upload Content</h1>
              <p className="text-sm text-muted-foreground">
                Share your content with your audience
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestUpload}
              disabled={isUploading || testUploadStatus === 'testing'}
              className="text-xs"
            >
              {testUploadStatus === 'testing' ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Wifi className="w-3 h-3 mr-1" />
              )}
              Test Upload
            </Button>
            <Button
              variant={isBulkMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                if (!isBulkMode) {
                  clearFile();
                } else {
                  setBulkFiles([]);
                }
              }}
              disabled={isUploading}
              className={isBulkMode ? 'bg-[#FF6600] hover:bg-[#FF6600]/90' : ''}
            >
              <Plus className="w-4 h-4 mr-1" />
              Bulk Upload
            </Button>
          </div>
        </div>

        {uiError && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uiError}</span>
          </div>
        )}
        
        {fileSizeWarning && !uiError && (
          <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fileSizeWarning}</span>
          </div>
        )}

        {/* Test Upload Status */}
        {testUploadStatus !== 'idle' && testUploadMessage && (
          <div className={`mb-6 rounded-lg border p-3 text-sm flex items-center gap-2 ${
            testUploadStatus === 'success' 
              ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400'
              : testUploadStatus === 'error'
                ? 'border-destructive/50 bg-destructive/10 text-destructive'
                : 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400'
          }`}>
            {testUploadStatus === 'testing' && <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
            {testUploadStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {testUploadStatus === 'error' && <XCircle className="w-4 h-4 shrink-0" />}
            <span>{testUploadMessage}</span>
            {testUploadStatus !== 'testing' && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-xs"
                onClick={() => {
                  setTestUploadStatus('idle');
                  setTestUploadMessage(null);
                }}
              >
                Dismiss
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Zone */}
          <div className="space-y-6">
            {isBulkMode ? (
              /* Bulk Upload Mode */
              <>
                <Card
                  className={`border-2 border-dashed transition-colors ${
                    isDragging 
                      ? 'border-[#FF6600] bg-[#FF6600]/5' 
                      : 'border-border hover:border-[#FF6600]/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files.length > 0) {
                      handleBulkFileSelect(e.dataTransfer.files);
                    }
                  }}
                >
                  <CardContent className="py-8">
                    <input
                      type="file"
                      id="bulk-file-upload"
                      className="hidden"
                      accept={ALLOWED_TYPES.join(',')}
                      multiple
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleBulkFileSelect(e.target.files);
                          e.target.value = '';
                        }
                      }}
                    />
                    <label
                      htmlFor="bulk-file-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full bg-[#FF6600]/10 flex items-center justify-center mb-3">
                        <Plus className="w-8 h-8 text-[#FF6600]" />
                      </div>
                      <p className="text-lg font-medium mb-1">
                        Add Files
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Select up to {MAX_BULK_FILES} files
                      </p>
                    </label>
                  </CardContent>
                </Card>

                {/* Bulk File Queue */}
                {bulkFiles.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Upload Queue ({bulkFiles.length}/{MAX_BULK_FILES})</span>
                        {bulkProcessingCount > 0 && (
                          <Badge variant="secondary" className="animate-pulse">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Processing {bulkProcessingCount}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                      {bulkFiles.map((item) => (
                        <div 
                          key={item.id} 
                          className={`flex items-center gap-3 p-2 rounded-lg border ${
                            item.status === 'error' ? 'border-destructive/50 bg-destructive/5' :
                            item.status === 'done' ? 'border-green-500/50 bg-green-500/5' :
                            'border-border'
                          }`}
                        >
                          {/* Preview */}
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {item.preview ? (
                              <img src={item.preview} alt="" className="w-full h-full object-cover" />
                            ) : item.status === 'processing' || item.status === 'pending' ? (
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.file.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{(item.file.size / (1024 * 1024)).toFixed(1)} MB</span>
                              {item.compressionSavings && item.compressionSavings > 0 && (
                                <Badge variant="outline" className="text-green-500 border-green-500/30 text-[10px] py-0">
                                  -{item.compressionSavings}%
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Status */}
                          <div className="shrink-0">
                            {item.status === 'done' && (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                            {item.status === 'error' && (
                              <XCircle className="w-5 h-5 text-destructive" />
                            )}
                            {item.status === 'uploading' && (
                              <Loader2 className="w-5 h-5 animate-spin text-[#FF6600]" />
                            )}
                            {(item.status === 'ready' || item.status === 'pending' || item.status === 'processing') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeBulkFile(item.id)}
                                disabled={isUploading || item.status === 'processing'}
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Bulk Upload Progress */}
                {isUploading && bulkUploadProgress.total > 0 && (
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-[#FF6600]" />
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-2">
                            Uploading {bulkUploadProgress.current} of {bulkUploadProgress.total}
                          </p>
                          <Progress 
                            value={(bulkUploadProgress.current / bulkUploadProgress.total) * 100} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : !file ? (
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
                    <>
                      {/* Show thumbnail as poster, with video on hover/click */}
                      {videoThumbnail ? (
                        <div className="relative group">
                          <img
                            src={videoThumbnail}
                            alt="Video thumbnail"
                            className="w-full aspect-video object-contain bg-black"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                              <Film className="w-8 h-8 text-black ml-1" />
                            </div>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="absolute bottom-2 left-2 bg-black/70 text-white"
                          >
                            Video
                          </Badge>
                        </div>
                      ) : preview ? (
                        <video
                          src={preview}
                          className="w-full aspect-video object-contain bg-black"
                          controls
                        />
                      ) : (
                        <div className="w-full aspect-video bg-muted flex items-center justify-center">
                          <div className="text-center">
                            <Film className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Generating preview...</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full aspect-video object-contain bg-muted"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Generating preview...</p>
                      </div>
                    </div>
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
                  {uploadTimeEstimate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Clock className="w-3 h-3" />
                      <span>Estimated upload time: {uploadTimeEstimate}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Video Thumbnail Picker */}
            {file && isVideo && videoDuration && videoDuration > 2 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon2 className="w-5 h-5 text-[#FF6600]" />
                    Thumbnail
                    {isGeneratingThumbnail && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select the frame to use as the preview thumbnail
                  </p>
                  <div className="space-y-3">
                    <Slider
                      value={[thumbnailTime]}
                      min={0}
                      max={Math.floor(videoDuration)}
                      step={0.5}
                      onValueChange={([value]) => handleThumbnailTimeChange(value)}
                      disabled={isGeneratingThumbnail || isCompressing}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0:00</span>
                      <span className="font-medium text-foreground">
                        {formatTime(thumbnailTime)}
                      </span>
                      <span>{formatTime(videoDuration)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compression Progress */}
            {isCompressing && (
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    {compressionProgress ? (
                      <Film className="w-5 h-5 animate-pulse text-[#FF6600]" />
                    ) : (
                      <Zap className="w-5 h-5 animate-pulse text-[#FF6600]" />
                    )}
                    <div className="flex-1">
                      {compressionProgress ? (
                        <>
                          <p className="text-sm font-medium mb-2">
                            {compressionProgress.message}
                          </p>
                          {compressionProgress.stage === 'compressing' && (
                            <Progress value={compressionProgress.progress} className="h-2" />
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">Optimizing image...</p>
                          <p className="text-xs text-muted-foreground">Reducing file size for faster upload</p>
                        </>
                      )}
                    </div>
                    {compressionProgress && compressionProgress.stage === 'compressing' && (
                      <span className="text-sm text-muted-foreground">
                        {compressionProgress.progress}%
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Progress with Retry Status */}
            {isUploading && (
              <Card className={uploadState.status === 'retrying' ? 'border-yellow-500/50' : ''}>
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    {uploadState.status === 'retrying' ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-yellow-500" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-[#FF6600]" />
                    )}
                    <div className="flex-1">
                      {uploadState.status === 'retrying' ? (
                        <>
                          <p className="text-sm font-medium text-yellow-500 mb-1">
                            Retrying... (Attempt {uploadState.attempt}/{uploadState.maxAttempts})
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {uploadState.error || 'Connection issue, retrying automatically'}
                          </p>
                          {uploadState.retryingIn && (
                            <p className="text-xs text-muted-foreground">
                              Waiting {Math.round(uploadState.retryingIn / 1000)}s before retry...
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium mb-2">
                            Uploading...
                            {uploadState.attempt > 1 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (Attempt {uploadState.attempt}/{uploadState.maxAttempts})
                              </span>
                            )}
                          </p>
                          <Progress value={uploadState.progress} className="h-2" />
                        </>
                      )}
                    </div>
                    {uploadState.status !== 'retrying' && (
                      <span className="text-sm text-muted-foreground">
                        {uploadState.progress}%
                      </span>
                    )}
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

            {/* Compression Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#FF6600]" />
                  Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Original Quality</p>
                    <p className="text-sm text-muted-foreground">
                      Skip compression and upload full quality
                    </p>
                  </div>
                  <Switch
                    checked={skipCompression}
                    onCheckedChange={(checked) => {
                      setSkipCompression(checked);
                      // Re-process file if one is selected
                      if (originalFile) {
                        handleFileSelect(originalFile, checked);
                      }
                    }}
                    disabled={isCompressing || isUploading}
                  />
                </div>
                
                {/* Quality Presets */}
                {!skipCompression && (
                  <div className="space-y-3 pt-3 border-t">
                    <Label className="text-sm font-medium">Compression Quality</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['low', 'medium', 'high'] as CompressionQuality[]).map((quality) => {
                        const imagePreset = IMAGE_QUALITY_PRESETS[quality];
                        const videoPreset = VIDEO_QUALITY_PRESETS[quality];
                        const isVideo = originalFile?.type.startsWith('video/');
                        const preset = isVideo ? videoPreset : imagePreset;
                        
                        return (
                          <button
                            key={quality}
                            type="button"
                            onClick={() => {
                              setCompressionQuality(quality);
                              // Re-process file if one is selected with the new quality
                              if (originalFile && !skipCompression) {
                                handleFileSelect(originalFile, false, quality);
                              }
                            }}
                            disabled={isCompressing || isUploading}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              compressionQuality === quality
                                ? 'border-[#FF6600] bg-[#FF6600]/10 ring-1 ring-[#FF6600]'
                                : 'border-border hover:border-[#FF6600]/50'
                            } ${(isCompressing || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <p className="font-medium text-sm">{preset.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {preset.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {originalFile?.type.startsWith('video/') 
                        ? `Video will be resized to max ${VIDEO_QUALITY_PRESETS[compressionQuality].maxWidth}x${VIDEO_QUALITY_PRESETS[compressionQuality].maxHeight}`
                        : `Image will be resized to max ${IMAGE_QUALITY_PRESETS[compressionQuality].maxDimension}px`
                      }
                    </p>
                  </div>
                )}
                
                {!skipCompression && !originalFile && (
                  <div className="bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-lg p-3">
                    <p className="text-sm text-[#FF6600] flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Images & videos are optimized for faster uploads
                    </p>
                  </div>
                )}
                {skipCompression && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Large files may take longer to upload
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#FF6600]" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Schedule for Later</p>
                    <p className="text-sm text-muted-foreground">
                      Publish at a specific date and time
                    </p>
                  </div>
                  <Switch
                    checked={isScheduled}
                    onCheckedChange={setIsScheduled}
                    disabled={isUploading}
                  />
                </div>

                {isScheduled && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="schedule-date">Date</Label>
                      <Input
                        id="schedule-date"
                        type="date"
                        min={getMinDate()}
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schedule-time">Time</Label>
                      <Input
                        id="schedule-time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                    {scheduledDate && scheduledTime && (
                      <div className="col-span-2 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-lg p-3">
                        <p className="text-sm text-[#FF6600] flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Will publish on {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!isScheduled && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Content will publish immediately
                    </p>
                  </div>
                )}
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
              onClick={isBulkMode ? handleBulkUpload : handleUpload}
              disabled={!canSubmit || isUploading || (isBulkMode && bulkProcessingCount > 0)}
              className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isBulkMode ? `Uploading ${bulkUploadProgress.current}/${bulkUploadProgress.total}...` : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {isBulkMode 
                    ? `Upload ${bulkReadyCount} File${bulkReadyCount !== 1 ? 's' : ''}` 
                    : isScheduled && scheduledDate && scheduledTime
                      ? 'Schedule Content'
                      : 'Upload Content'
                  }
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

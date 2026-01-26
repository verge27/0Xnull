import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Eye, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BlogImportDialog } from './BlogImportDialog';

const CATEGORIES = [
  { value: 'crypto', label: 'Crypto' },
  { value: 'esports', label: 'Esports' },
  { value: 'sports', label: 'Sports' },
  { value: 'privacy', label: 'Privacy' },
  { value: 'predictions', label: 'Predictions' },
  { value: 'guides', label: 'Guides' },
];

interface BlogPostEditorProps {
  onSave?: () => void;
}

export function BlogPostEditor({ onSave }: BlogPostEditorProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    author_name: 'Admin',
    status: 'draft' as 'draft' | 'published',
    meta_description: '',
    featured_image: '',
  });
  
  const handleImport = (data: { title: string; content: string; slug: string; excerpt: string }) => {
    setFormData((prev) => ({
      ...prev,
      title: data.title,
      content: data.content,
      slug: data.slug,
      excerpt: data.excerpt,
      meta_description: data.excerpt,
    }));
    toast.success('Content loaded into editor');
  };
  
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  };
  
  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };
  
  const handleSave = async (publish = false) => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }
    
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    
    setLoading(true);
    
    try {
      const status = publish ? 'published' : 'draft';
      const slug = formData.slug || generateSlug(formData.title);
      
      const { error } = await supabase.from('blog_posts').insert({
        title: formData.title.trim(),
        slug: slug + '-' + Date.now().toString(36),
        excerpt: formData.excerpt.trim() || null,
        content: formData.content.trim(),
        category: formData.category,
        author_name: formData.author_name.trim() || 'Admin',
        status,
        meta_description: formData.meta_description.trim() || formData.excerpt.trim() || null,
        featured_image: formData.featured_image.trim() || null,
        published_at: publish ? new Date().toISOString() : null,
      });
      
      if (error) throw error;
      
      toast.success(publish ? 'Post published!' : 'Draft saved!');
      
      // Reset form
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: '',
        author_name: 'Admin',
        status: 'draft',
        meta_description: '',
        featured_image: '',
      });
      
      onSave?.();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Create Blog Post</CardTitle>
        <BlogImportDialog 
          onImport={handleImport}
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter post title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              placeholder="auto-generated-from-title"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              placeholder="Author name"
              value={formData.author_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, author_name: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            placeholder="Brief summary of the post (shown in previews)"
            value={formData.excerpt}
            onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
            rows={2}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            placeholder="Write your post content here (supports Markdown)"
            value={formData.content}
            onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
            rows={12}
            className="font-mono text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="featured-image">Featured Image URL</Label>
          <Input
            id="featured-image"
            placeholder="https://example.com/image.jpg"
            value={formData.featured_image}
            onChange={(e) => setFormData((prev) => ({ ...prev, featured_image: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="meta">Meta Description</Label>
          <Textarea
            id="meta"
            placeholder="SEO description (defaults to excerpt)"
            value={formData.meta_description}
            onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
            rows={2}
          />
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Publish
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Link, Upload, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportedContent {
  title: string;
  content: string;
  slug: string;
  excerpt: string;
  source: string;
}

interface BlogImportDialogProps {
  onImport: (data: ImportedContent) => void;
  trigger?: React.ReactNode;
}

export function BlogImportDialog({ onImport, trigger }: BlogImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleDocsUrl, setGoogleDocsUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleGoogleDocsImport = async () => {
    if (!googleDocsUrl.trim()) {
      toast.error('Please enter a Google Doc URL');
      return;
    }
    
    if (!googleDocsUrl.includes('docs.google.com/document')) {
      toast.error('Please enter a valid Google Docs URL');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-blog-content', {
        body: {
          type: 'google-docs',
          url: googleDocsUrl,
        },
      });
      
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Import failed');
      
      toast.success('Content imported successfully!');
      onImport(data.data);
      setOpen(false);
      setGoogleDocsUrl('');
    } catch (err) {
      console.error('Google Docs import error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to import from Google Docs');
    } finally {
      setLoading(false);
    }
  };
  
  const handleWordUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a Word document');
      return;
    }
    
    if (!selectedFile.name.endsWith('.docx')) {
      toast.error('Please upload a .docx file');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert file to base64
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      
      const { data, error } = await supabase.functions.invoke('import-blog-content', {
        body: {
          type: 'docx',
          fileBase64: base64,
          fileName: selectedFile.name,
        },
      });
      
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Import failed');
      
      toast.success('Document imported successfully!');
      onImport(data.data);
      setOpen(false);
      setSelectedFile(null);
    } catch (err) {
      console.error('Word import error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to import Word document');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        toast.error('Please select a .docx file');
        return;
      }
      setSelectedFile(file);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import Content
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Import Blog Content
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="google-docs" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="google-docs" className="gap-2">
              <Link className="w-4 h-4" />
              Google Docs
            </TabsTrigger>
            <TabsTrigger value="word" className="gap-2">
              <FileText className="w-4 h-4" />
              Word (.docx)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="google-docs" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="google-docs-url">Google Doc URL</Label>
              <Input
                id="google-docs-url"
                placeholder="https://docs.google.com/document/d/..."
                value={googleDocsUrl}
                onChange={(e) => setGoogleDocsUrl(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Make sure the document is set to "Anyone with the link can view"
              </p>
            </div>
            
            <Button 
              onClick={handleGoogleDocsImport} 
              disabled={loading || !googleDocsUrl.trim()}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Import from Google Docs
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="word" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="word-file">Word Document</Label>
              <div className="flex gap-2">
                <Input
                  id="word-file"
                  type="file"
                  accept=".docx"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="cursor-pointer"
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {selectedFile.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Upload a .docx file (max 10MB)
              </p>
            </div>
            
            <Button 
              onClick={handleWordUpload} 
              disabled={loading || !selectedFile}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Import
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Unlock, Coins, Settings, LogOut, 
  MoreVertical, Pencil, Trash2, Loader2, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCreatorAuth } from '@/hooks/useCreatorAuth';
import { creatorApi, ContentItem } from '@/services/creatorApi';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import CreatorUploadModal from '@/components/creator/CreatorUploadModal';

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { creator, isLoading: authLoading, isAuthenticated, logout, truncateKey, refreshProfile } = useCreatorAuth();
  
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/creator/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch content
  useEffect(() => {
    const fetchContent = async () => {
      if (!isAuthenticated) return;
      
      try {
        const { content } = await creatorApi.getMyContent();
        setContent(content);
      } catch (error) {
        console.error('Failed to fetch content:', error);
        toast.error('Failed to load your content');
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchContent();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/creators');
  };

  const handleDeleteContent = async (contentId: string) => {
    try {
      await creatorApi.deleteContent(contentId);
      setContent(prev => prev.filter(c => c.id !== contentId));
      toast.success('Content deleted');
      refreshProfile();
    } catch (error) {
      console.error('Failed to delete content:', error);
      toast.error('Failed to delete content');
    }
  };

  const handleUploadSuccess = (newContent: ContentItem) => {
    setContent(prev => [newContent, ...prev]);
    refreshProfile();
  };

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
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{creator.displayName}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {truncateKey(creator.publicKey, 8, 8)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/creator/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-[#FF6600]/20 bg-[#FF6600]/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#FF6600]" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#FF6600]">
                {creator.stats?.total_earnings_xmr.toFixed(4) || '0.0000'} XMR
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {creator.stats?.total_views.toLocaleString() || '0'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Unlock className="w-4 h-4" />
                Total Unlocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {creator.stats?.total_unlocks.toLocaleString() || '0'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Content</h2>
          <Button 
            onClick={() => setIsUploadOpen(true)}
            className="bg-[#FF6600] hover:bg-[#FF6600]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>

        {isLoadingContent ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : content.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No content yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first content to start earning
              </p>
              <Button onClick={() => setIsUploadOpen(true)} className="bg-[#FF6600] hover:bg-[#FF6600]/90">
                <Plus className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {content.map((item) => (
              <Card key={item.id} className="overflow-hidden group">
                <div className="relative aspect-video bg-muted">
                  {item.thumbnail_url ? (
                    <img
                      src={creatorApi.getMediaUrl(item.thumbnail_url)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <Badge
                    className={`absolute top-2 right-2 ${
                      item.tier === 'paid' 
                        ? 'bg-[#FF6600] text-white' 
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    {item.tier === 'paid' ? `${item.price_xmr} XMR` : 'Free'}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {item.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> {item.unlock_count}
                        </span>
                        <span className="flex items-center gap-1 text-[#FF6600]">
                          <Coins className="w-3 h-3" /> {item.earnings_xmr.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/content/${item.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteContent(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <CreatorUploadModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default CreatorDashboard;

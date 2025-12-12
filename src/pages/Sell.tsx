import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { CsvImportDialog } from '@/components/CsvImportDialog';
import { ListingAnalyticsChart } from '@/components/ListingAnalyticsChart';
import { getOrders } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, DollarSign, ShoppingBag, Trash2, Pencil, Copy, Pause, Play, Eye, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { PriceDisplay } from '@/components/PriceDisplay';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Sell = () => {
  const { user } = useAuth();
  const { userListings, loading, createManyListings, deleteListing, updateListing, createListing } = useListings();
  const { xmrToUsd } = useExchangeRate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [salesByListing, setSalesByListing] = useState<Record<string, number>>({});
  const [sortColumn, setSortColumn] = useState<'title' | 'price' | 'stock' | 'views' | 'sales' | 'created'>('created');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Fetch sales counts per listing
  useEffect(() => {
    const fetchSalesCounts = async () => {
      if (!user) return;
      
      const { data: orders } = await supabase
        .from('orders')
        .select('listing_id, quantity')
        .eq('seller_user_id', user.id);
      
      if (orders) {
        const counts: Record<string, number> = {};
        orders.forEach(order => {
          if (order.listing_id) {
            counts[order.listing_id] = (counts[order.listing_id] || 0) + order.quantity;
          }
        });
        setSalesByListing(counts);
      }
    };
    
    fetchSalesCounts();
  }, [user, userListings]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const orders = getOrders().filter(o => o.sellerId === user.id);
  
  const totalRevenue = orders
    .filter(o => o.status !== 'created')
    .reduce((sum, o) => sum + xmrToUsd(o.totalXmr), 0);
  
  const activeListings = userListings.filter(l => l.status === 'active').length;

  // Filter and sort listings
  const filteredAndSortedListings = userListings
    .filter(listing => statusFilter === 'all' || listing.status === statusFilter)
    .sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'price':
          comparison = a.price_usd - b.price_usd;
          break;
        case 'stock':
          comparison = a.stock - b.stock;
          break;
        case 'views':
          comparison = (a.views || 0) - (b.views || 0);
          break;
        case 'sales':
          comparison = (salesByListing[a.id] || 0) - (salesByListing[b.id] || 0);
          break;
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ column }: { column: typeof sortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1" /> 
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const handleDelete = async (id: string) => {
    await deleteListing(id);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const success = await updateListing(id, { status: newStatus } as any);
    if (success) {
      toast.success(`Listing ${newStatus === 'active' ? 'activated' : 'paused'}`);
    }
  };

  const handleDuplicate = async (listing: typeof userListings[0]) => {
    const result = await createListing({
      title: `${listing.title} (Copy)`,
      description: listing.description,
      price_usd: listing.price_usd,
      category: listing.category,
      images: listing.images,
      stock: listing.stock,
      shipping_price_usd: listing.shipping_price_usd,
      condition: listing.condition,
    });
    if (result) {
      toast.success('Listing duplicated!');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedListings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedListings.map(l => l.id)));
    }
  };

  const handleBulkPause = async () => {
    const ids = Array.from(selectedIds);
    let count = 0;
    for (const id of ids) {
      const success = await updateListing(id, { status: 'paused' } as any);
      if (success) count++;
    }
    toast.success(`${count} listing(s) paused`);
    setSelectedIds(new Set());
  };

  const handleBulkActivate = async () => {
    const ids = Array.from(selectedIds);
    let count = 0;
    for (const id of ids) {
      const success = await updateListing(id, { status: 'active' } as any);
      if (success) count++;
    }
    toast.success(`${count} listing(s) activated`);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    let count = 0;
    for (const id of ids) {
      const success = await deleteListing(id);
      if (success) count++;
    }
    toast.success(`${count} listing(s) deleted`);
    setSelectedIds(new Set());
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Seller Dashboard</h1>
            <p className="text-muted-foreground">Manage your listings and orders</p>
          </div>
          <div className="flex gap-2">
            <CsvImportDialog onImport={createManyListings} />
            <Link to="/sell/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-primary">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Active Listings</p>
                  <p className="text-3xl font-bold">{activeListings}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Orders</p>
                  <p className="text-3xl font-bold">{orders.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Chart */}
        <ListingAnalyticsChart listings={userListings} />

        {/* Listings */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Listings</h2>
              
              {/* Filter Controls */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'paused')}
                  className="text-sm border border-input bg-background rounded-md px-3 py-1.5"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
            
            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                <Button variant="outline" size="sm" onClick={handleBulkActivate} className="gap-1">
                  <Play className="w-3 h-3" />
                  Activate
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkPause} className="gap-1">
                  <Pause className="w-3 h-3" />
                  Pause
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {selectedIds.size} Listing(s)?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the selected listings. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleBulkDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Clear
                </Button>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading listings...
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={filteredAndSortedListings.length > 0 && selectedIds.size === filteredAndSortedListings.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('title')} className="flex items-center hover:text-foreground">
                          Product <SortIcon column="title" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('price')} className="flex items-center hover:text-foreground">
                          Price <SortIcon column="price" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('stock')} className="flex items-center hover:text-foreground">
                          Stock <SortIcon column="stock" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('views')} className="flex items-center hover:text-foreground">
                          <Eye className="w-3 h-3 mr-1" />
                          Views <SortIcon column="views" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('sales')} className="flex items-center hover:text-foreground">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Sales <SortIcon column="sales" />
                        </button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedListings.map(listing => (
                      <TableRow key={listing.id} className={selectedIds.has(listing.id) ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(listing.id)}
                            onCheckedChange={() => toggleSelection(listing.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={listing.images[0] || '/placeholder.svg'}
                              alt={listing.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <span className="font-medium">{listing.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          <PriceDisplay usdAmount={listing.price_usd} />
                        </TableCell>
                        <TableCell>{listing.stock}</TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">{listing.views || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-primary">{salesByListing[listing.id] || 0}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={listing.status === 'active'}
                              onCheckedChange={() => handleToggleStatus(listing.id, listing.status)}
                            />
                            <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                              {listing.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link to={`/sell/edit/${listing.id}`}>
                              <Button variant="ghost" size="icon" title="Edit">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Duplicate"
                              onClick={() => handleDuplicate(listing)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{listing.title}". This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(listing.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredAndSortedListings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {userListings.length === 0 
                      ? "No listings yet. Create your first listing to get started!"
                      : "No listings match your filter."}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.id}</TableCell>
                    <TableCell className="font-semibold">{order.totalXmr} XMR</TableCell>
                    <TableCell>
                      <Badge>{order.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link to={`/order/${order.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {orders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No orders yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sell;

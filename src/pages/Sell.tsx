import { Link, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { CsvImportDialog } from '@/components/CsvImportDialog';
import { getOrders } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, DollarSign, ShoppingBag, Trash2 } from 'lucide-react';
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
  const { userListings, loading, createManyListings, deleteListing } = useListings();
  const { xmrToUsd } = useExchangeRate();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const orders = getOrders().filter(o => o.sellerId === user.id);
  
  const totalRevenue = orders
    .filter(o => o.status !== 'created')
    .reduce((sum, o) => sum + xmrToUsd(o.totalXmr), 0);
  
  const activeListings = userListings.filter(l => l.status === 'active').length;

  const handleDelete = async (id: string) => {
    await deleteListing(id);
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

        {/* Listings */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">My Listings</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading listings...
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userListings.map(listing => (
                      <TableRow key={listing.id}>
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
                          <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                            {listing.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {userListings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No listings yet. Create your first listing to get started!
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

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Package, Truck, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, ShoppingBag, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useOrders, type Order, type OrderStatus } from '@/hooks/useOrders';
import { usePGP } from '@/hooks/usePGP';
import { useSEO } from '@/hooks/useSEO';
import { PGPPassphraseDialog } from '@/components/PGPPassphraseDialog';

const statusConfig: Record<OrderStatus, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending Payment', icon: <Clock className="w-4 h-4" />, variant: 'secondary' },
  paid: { label: 'Paid', icon: <CheckCircle className="w-4 h-4" />, variant: 'default' },
  shipped: { label: 'Shipped', icon: <Truck className="w-4 h-4" />, variant: 'default' },
  delivered: { label: 'Delivered', icon: <Package className="w-4 h-4" />, variant: 'default' },
  completed: { label: 'Completed', icon: <CheckCircle className="w-4 h-4" />, variant: 'default' },
  cancelled: { label: 'Cancelled', icon: <XCircle className="w-4 h-4" />, variant: 'destructive' },
  disputed: { label: 'Disputed', icon: <AlertTriangle className="w-4 h-4" />, variant: 'destructive' },
};

const Orders = () => {
  const { orders, loading, isAuthenticated, updateOrderStatus, isBuyer, isSeller } = useOrders();
  const { isUnlocked, decryptMessage, isPGPEncrypted, restoreSession } = usePGP();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showPgpDialog, setShowPgpDialog] = useState(false);
  const [decryptedAddresses, setDecryptedAddresses] = useState<Record<string, string>>({});
  const [decrypting, setDecrypting] = useState<string | null>(null);

  // Restore PGP session on mount
  React.useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Decrypt shipping address for seller
  const handleDecryptAddress = async (orderId: string, encryptedAddress: string) => {
    if (!isUnlocked) {
      setShowPgpDialog(true);
      return;
    }

    setDecrypting(orderId);
    try {
      const decrypted = await decryptMessage(encryptedAddress);
      if (decrypted) {
        setDecryptedAddresses(prev => ({ ...prev, [orderId]: decrypted }));
      } else {
        toast.error('Failed to decrypt address. Make sure you have the correct PGP key.');
      }
    } catch (e) {
      console.error('Decryption error:', e);
      toast.error('Decryption failed');
    } finally {
      setDecrypting(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign in to view orders</h1>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const buyerOrders = orders.filter(o => isBuyer(o));
  const sellerOrders = orders.filter(o => isSeller(o));

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus, extras?: Partial<Order>) => {
    setUpdating(true);
    const success = await updateOrderStatus(orderId, newStatus, extras);
    setUpdating(false);
    
    if (success) {
      toast.success(`Order status updated to ${statusConfig[newStatus].label}`);
      setSelectedOrder(null);
      setTrackingNumber('');
    } else {
      toast.error('Failed to update order');
    }
  };

  const renderOrderRow = (order: Order, role: 'buyer' | 'seller') => {
    const config = statusConfig[order.status];
    
    return (
      <TableRow key={order.id}>
        <TableCell className="font-mono text-xs">
          {order.id.slice(0, 8)}...
        </TableCell>
        <TableCell>
          {order.listing ? (
            <div className="flex items-center gap-3">
              {order.listing.images?.[0] && (
                <img
                  src={order.listing.images[0]}
                  alt={order.listing.title}
                  className="w-10 h-10 object-cover rounded"
                />
              )}
              <span className="font-medium truncate max-w-[150px]">{order.listing.title}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Listing removed</span>
          )}
        </TableCell>
        <TableCell>
          {role === 'buyer' ? order.seller_name : order.buyer_name}
        </TableCell>
        <TableCell className="font-semibold">${order.total_price_usd.toFixed(2)}</TableCell>
        <TableCell>
          <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
        </TableCell>
        <TableCell>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedOrder(order)}
          >
            View
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  const renderEmptyState = (type: 'buying' | 'selling') => (
    <div className="text-center py-12">
      <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground mb-4">
        {type === 'buying' ? 'No purchases yet' : 'No sales yet'}
      </p>
      {type === 'buying' && (
        <Link to="/browse">
          <Button>Start Shopping</Button>
        </Link>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Orders</h1>
          <p className="text-muted-foreground">Track and manage your purchases and sales</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="buying" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="buying">
                Purchases ({buyerOrders.length})
              </TabsTrigger>
              <TabsTrigger value="selling">
                Sales ({sellerOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buying">
              <Card>
                <CardContent className="p-0">
                  {buyerOrders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Seller</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buyerOrders.map(order => renderOrderRow(order, 'buyer'))}
                      </TableBody>
                    </Table>
                  ) : (
                    renderEmptyState('buying')
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="selling">
              <Card>
                <CardContent className="p-0">
                  {sellerOrders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sellerOrders.map(order => renderOrderRow(order, 'seller'))}
                      </TableBody>
                    </Table>
                  ) : (
                    renderEmptyState('selling')
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order ID</p>
                    <p className="font-mono">{selectedOrder.id.slice(0, 12)}...</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={statusConfig[selectedOrder.status].variant} className="gap-1 mt-1">
                      {statusConfig[selectedOrder.status].icon}
                      {statusConfig[selectedOrder.status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Product</p>
                    <p className="font-medium">{selectedOrder.listing?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-medium">{selectedOrder.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Unit Price</p>
                    <p className="font-medium">${selectedOrder.unit_price_usd.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Shipping</p>
                    <p className="font-medium">${selectedOrder.shipping_price_usd.toFixed(2)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-bold text-lg">${selectedOrder.total_price_usd.toFixed(2)}</p>
                  </div>
                  {selectedOrder.tracking_number && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Tracking Number</p>
                      <p className="font-mono">{selectedOrder.tracking_number}</p>
                    </div>
                  )}
                  {selectedOrder.shipping_address && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground flex items-center gap-2">
                        Shipping Address
                        {isPGPEncrypted(selectedOrder.shipping_address) && (
                          <Lock className="w-3 h-3 text-green-500" />
                        )}
                      </p>
                      {isPGPEncrypted(selectedOrder.shipping_address) ? (
                        // Encrypted address - show decrypt UI for sellers
                        isSeller(selectedOrder) ? (
                          decryptedAddresses[selectedOrder.id] ? (
                            <div className="mt-2">
                              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs mb-2">
                                  <Unlock className="w-3 h-3" />
                                  Decrypted
                                </div>
                                <p className="whitespace-pre-wrap font-medium">{decryptedAddresses[selectedOrder.id]}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 text-xs"
                                onClick={() => setDecryptedAddresses(prev => {
                                  const updated = { ...prev };
                                  delete updated[selectedOrder.id];
                                  return updated;
                                })}
                              >
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hide Address
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <div className="bg-muted rounded-lg p-3 text-xs font-mono text-muted-foreground mb-2 max-h-20 overflow-hidden">
                                {selectedOrder.shipping_address.slice(0, 100)}...
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDecryptAddress(selectedOrder.id, selectedOrder.shipping_address!)}
                                disabled={decrypting === selectedOrder.id}
                              >
                                {decrypting === selectedOrder.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <Eye className="w-3 h-3 mr-1" />
                                )}
                                {isUnlocked ? 'Decrypt Address' : 'Unlock PGP to Decrypt'}
                              </Button>
                            </div>
                          )
                        ) : (
                          // Buyer sees encrypted confirmation
                          <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                              <Lock className="w-4 h-4" />
                              <span>Your address is encrypted - only the seller can read it</span>
                            </div>
                          </div>
                        )
                      ) : (
                        // Unencrypted address (legacy orders)
                        <p className="whitespace-pre-wrap">{selectedOrder.shipping_address}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Seller Actions */}
                {isSeller(selectedOrder) && selectedOrder.status === 'paid' && (
                  <div className="border-t pt-4 space-y-3">
                    <p className="font-medium">Mark as Shipped</p>
                    <Input
                      placeholder="Tracking number (optional)"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                    <Button 
                      className="w-full"
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'shipped', { tracking_number: trackingNumber || null })}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                      Mark as Shipped
                    </Button>
                  </div>
                )}

                {/* Buyer Actions */}
                {isBuyer(selectedOrder) && selectedOrder.status === 'shipped' && (
                  <div className="border-t pt-4 space-y-3">
                    <Button 
                      className="w-full"
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'delivered')}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                      Confirm Delivery
                    </Button>
                  </div>
                )}

                {isBuyer(selectedOrder) && selectedOrder.status === 'delivered' && (
                  <div className="border-t pt-4 space-y-3">
                    <Button 
                      className="w-full"
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'completed')}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Complete Order
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PGP Passphrase Dialog */}
        <PGPPassphraseDialog
          open={showPgpDialog}
          onOpenChange={setShowPgpDialog}
          onUnlocked={() => {
            setShowPgpDialog(false);
            toast.success('PGP unlocked! You can now decrypt addresses.');
          }}
        />
      </div>
    </div>
  );
};

export default Orders;

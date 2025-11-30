import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { addListing } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const NewListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceUsd: '',
    category: 'Physical',
    imageUrl: '',
    stock: '',
    shippingPriceUsd: '0'
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.priceUsd || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newListing = {
      id: `listing-${Date.now()}`,
      sellerId: user.id,
      title: formData.title,
      description: formData.description,
      priceUsd: parseFloat(formData.priceUsd),
      category: formData.category,
      images: [formData.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
      stock: parseInt(formData.stock),
      shippingPriceUsd: parseFloat(formData.shippingPriceUsd),
      status: 'active' as const
    };

    addListing(newListing);
    toast.success('Listing created successfully!');
    navigate('/sell');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Create New Listing</h1>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Premium Leather Wallet"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your product..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priceUsd">Price (USD) *</Label>
                  <Input
                    id="priceUsd"
                    type="number"
                    step="0.01"
                    value={formData.priceUsd}
                    onChange={(e) => setFormData({ ...formData, priceUsd: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingPriceUsd">Shipping (USD)</Label>
                  <Input
                    id="shippingPriceUsd"
                    type="number"
                    step="0.01"
                    value={formData.shippingPriceUsd}
                    onChange={(e) => setFormData({ ...formData, shippingPriceUsd: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Physical">Physical</SelectItem>
                      <SelectItem value="Digital">Digital</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg (optional)"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty for default placeholder
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Create Listing
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewListing;

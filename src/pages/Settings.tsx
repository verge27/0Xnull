import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { settingsSchema } from '@/lib/validation';

const Settings = () => {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [xmrAddress, setXmrAddress] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setXmrAddress(profile.xmr_address || '');
    }
  }, [profile]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSave = async () => {
    // Validate inputs
    try {
      settingsSchema.parse({
        displayName,
        xmrAddress: xmrAddress || ''
      });
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || 'Invalid input');
      return;
    }

    const { error } = await updateProfile({
      display_name: displayName,
      xmr_address: xmrAddress || null
    });
    
    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved successfully!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            <div>
              <Label htmlFor="xmrAddress">XMR Address</Label>
              <Input
                id="xmrAddress"
                value={xmrAddress}
                onChange={(e) => setXmrAddress(e.target.value)}
                placeholder="Your Monero address"
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground mt-1">
                This is where you'll receive payments for your sales
              </p>
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

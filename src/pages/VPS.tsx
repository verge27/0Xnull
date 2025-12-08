import { useState, useEffect } from 'react';
import { Server, Plus, Trash2, RefreshCw, Copy, ExternalLink, Shield, AlertTriangle, Check } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const SPORESTACK_API = 'https://api.sporestack.com';

interface Server {
  machine_id: string;
  hostname: string;
  ipv4: string;
  ipv6: string;
  region: string;
  flavor: string;
  operating_system: string;
  created_at: string;
  expiration: string;
  running: boolean;
}

interface Flavor {
  slug: string;
  cores: number;
  memory: number;
  disk: number;
  bandwidth: number;
  price_per_day: number;
}

interface Region {
  slug: string;
  name: string;
}

const flavors: Flavor[] = [
  { slug: 'vps-1vcpu-1gb', cores: 1, memory: 1, disk: 25, bandwidth: 1000, price_per_day: 0.5 },
  { slug: 'vps-1vcpu-2gb', cores: 1, memory: 2, disk: 50, bandwidth: 2000, price_per_day: 1 },
  { slug: 'vps-2vcpu-2gb', cores: 2, memory: 2, disk: 60, bandwidth: 3000, price_per_day: 1.5 },
  { slug: 'vps-2vcpu-4gb', cores: 2, memory: 4, disk: 80, bandwidth: 4000, price_per_day: 2 },
  { slug: 'vps-4vcpu-8gb', cores: 4, memory: 8, disk: 160, bandwidth: 5000, price_per_day: 4 },
];

const regions: Region[] = [
  { slug: 'nyc', name: 'New York' },
  { slug: 'ams', name: 'Amsterdam' },
  { slug: 'sgp', name: 'Singapore' },
  { slug: 'lon', name: 'London' },
  { slug: 'fra', name: 'Frankfurt' },
];

const operatingSystems = [
  { slug: 'debian-12', name: 'Debian 12' },
  { slug: 'ubuntu-22.04', name: 'Ubuntu 22.04 LTS' },
  { slug: 'ubuntu-24.04', name: 'Ubuntu 24.04 LTS' },
  { slug: 'rocky-9', name: 'Rocky Linux 9' },
  { slug: 'fedora-40', name: 'Fedora 40' },
];

const VPS = () => {
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  
  // Token generation flow
  const [isNewToken, setIsNewToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  
  // New server config
  const [selectedFlavor, setSelectedFlavor] = useState('vps-1vcpu-1gb');
  const [selectedRegion, setSelectedRegion] = useState('ams');
  const [selectedOS, setSelectedOS] = useState('debian-12');
  const [hostname, setHostname] = useState('');
  const [sshKey, setSshKey] = useState('');
  const [days, setDays] = useState('30');
  
  const [fundingOpen, setFundingOpen] = useState(false);
  const [fundingAddress, setFundingAddress] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('sporestack_token');
    if (stored) {
      setSavedToken(stored);
      fetchServers(stored);
      fetchBalance(stored);
    }
  }, []);

  const confirmTokenSaved = () => {
    if (!token) return;
    localStorage.setItem('sporestack_token', token);
    setSavedToken(token);
    setIsNewToken(false);
    setTokenCopied(false);
    fetchServers(token);
    fetchBalance(token);
    toast({ title: 'Token saved', description: 'Your API token has been saved locally' });
  };

  const saveExistingToken = () => {
    if (!token) return;
    localStorage.setItem('sporestack_token', token);
    setSavedToken(token);
    fetchServers(token);
    fetchBalance(token);
    toast({ title: 'Token loaded', description: 'Your existing token has been loaded' });
  };

  const clearToken = () => {
    localStorage.removeItem('sporestack_token');
    setSavedToken(null);
    setServers([]);
    setBalance(null);
    setToken('');
    setIsNewToken(false);
    setTokenCopied(false);
  };

  const generateToken = () => {
    const newToken = crypto.randomUUID();
    setToken(newToken);
    setIsNewToken(true);
    setTokenCopied(false);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    toast({ title: 'Token copied to clipboard' });
  };

  const fetchServers = async (apiToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${SPORESTACK_API}/servers`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setServers(data.servers || []);
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
    }
    setLoading(false);
  };

  const fetchBalance = async (apiToken: string) => {
    try {
      const response = await fetch(`${SPORESTACK_API}/token`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance_usd || 0);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const getFundingAddress = async () => {
    if (!savedToken) return;
    try {
      const response = await fetch(`${SPORESTACK_API}/token/topup`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${savedToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currency: 'xmr' }),
      });
      if (response.ok) {
        const data = await response.json();
        setFundingAddress(data.address || '');
        setFundingOpen(true);
      }
    } catch (error) {
      console.error('Error getting funding address:', error);
      toast({ title: 'Error', description: 'Failed to get funding address', variant: 'destructive' });
    }
  };

  const launchServer = async () => {
    if (!savedToken || !hostname || !sshKey) {
      toast({ title: 'Missing fields', description: 'Please fill hostname and SSH key', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SPORESTACK_API}/servers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${savedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flavor: selectedFlavor,
          region: selectedRegion,
          operating_system: selectedOS,
          hostname,
          ssh_key: sshKey,
          days: parseInt(days),
        }),
      });

      if (response.ok) {
        toast({ title: 'Server launched!', description: 'Your VPS is being provisioned' });
        setHostname('');
        fetchServers(savedToken);
        fetchBalance(savedToken);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to launch server');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const deleteServer = async (machineId: string) => {
    if (!savedToken) return;
    if (!confirm('Are you sure you want to delete this server?')) return;

    try {
      const response = await fetch(`${SPORESTACK_API}/servers/${machineId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (response.ok) {
        toast({ title: 'Server deleted' });
        fetchServers(savedToken);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete server', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!' });
  };

  const selectedFlavorDetails = flavors.find(f => f.slug === selectedFlavor);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Anonymous VPS</h1>
            <p className="text-muted-foreground">Privacy-focused virtual servers via SporeStack</p>
          </div>

          {!savedToken ? (
            /* Token Setup */
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  API Token Setup
                </CardTitle>
                <CardDescription>
                  {isNewToken 
                    ? 'Save this token! It cannot be recovered.'
                    : 'Enter an existing SporeStack token or generate a new one'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isNewToken ? (
                  /* Show generated token in plain text */
                  <>
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold text-destructive">Save this token now!</p>
                          <p className="text-muted-foreground">
                            There is no account recovery. If you lose this token, you lose access to your servers forever.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Your API Token</Label>
                      <div className="flex gap-2">
                        <Input
                          value={token}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={copyToken}
                        >
                          {tokenCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button 
                      onClick={confirmTokenSaved} 
                      className="w-full"
                    >
                      I've Saved My Token
                    </Button>

                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setIsNewToken(false);
                        setToken('');
                      }}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  /* Enter existing or generate new */
                  <>
                    <div className="space-y-2">
                      <Label>API Token</Label>
                      <Input
                        type="password"
                        placeholder="Enter existing token..."
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={generateToken} variant="outline" className="flex-1">
                        Generate New
                      </Button>
                      <Button onClick={saveExistingToken} disabled={!token} className="flex-1">
                        Load Token
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your token is stored locally. Keep it safe - it's the only way to access your servers.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Main Interface */
            <Tabs defaultValue="servers">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="servers">My Servers</TabsTrigger>
                  <TabsTrigger value="new">Launch New</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm">
                    Balance: ${balance?.toFixed(2) || '0.00'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={getFundingAddress}>
                    Add Funds
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearToken}>
                    Logout
                  </Button>
                </div>
              </div>

              <TabsContent value="servers">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Active Servers</h2>
                    <Button variant="outline" size="sm" onClick={() => fetchServers(savedToken)} disabled={loading}>
                      <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>

                  {servers.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Server className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">No servers found</p>
                        <p className="text-sm text-muted-foreground">Launch your first anonymous VPS</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {servers.map((server) => (
                        <Card key={server.machine_id}>
                          <CardContent className="py-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{server.hostname}</h3>
                                  <Badge variant={server.running ? 'default' : 'secondary'}>
                                    {server.running ? 'Running' : 'Stopped'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-muted-foreground">IPv4:</span>
                                  <code className="bg-secondary px-2 py-0.5 rounded">{server.ipv4}</code>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(server.ipv4)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {server.flavor} • {server.region} • {server.operating_system}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Expires: {new Date(server.expiration).toLocaleDateString()}
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => deleteServer(server.machine_id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="new">
                <Card>
                  <CardHeader>
                    <CardTitle>Configure New Server</CardTitle>
                    <CardDescription>Select your preferred specifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Flavor</Label>
                        <Select value={selectedFlavor} onValueChange={setSelectedFlavor}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {flavors.map((f) => (
                              <SelectItem key={f.slug} value={f.slug}>
                                {f.cores} vCPU / {f.memory}GB RAM / {f.disk}GB - ${f.price_per_day}/day
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Region</Label>
                        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map((r) => (
                              <SelectItem key={r.slug} value={r.slug}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Operating System</Label>
                        <Select value={selectedOS} onValueChange={setSelectedOS}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {operatingSystems.map((os) => (
                              <SelectItem key={os.slug} value={os.slug}>{os.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Duration (days)</Label>
                        <Select value={days} onValueChange={setDays}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="60">60 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Hostname</Label>
                      <Input
                        placeholder="my-server"
                        value={hostname}
                        onChange={(e) => setHostname(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>SSH Public Key</Label>
                      <Input
                        placeholder="ssh-ed25519 AAAA..."
                        value={sshKey}
                        onChange={(e) => setSshKey(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Required for server access</p>
                    </div>

                    {selectedFlavorDetails && (
                      <div className="bg-secondary/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span>Estimated cost:</span>
                          <span className="font-bold text-lg">
                            ${(selectedFlavorDetails.price_per_day * parseInt(days)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button className="w-full" onClick={launchServer} disabled={loading || !hostname || !sshKey}>
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Launching...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Launch Server
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Funding Dialog */}
          <Dialog open={fundingOpen} onOpenChange={setFundingOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Funds (XMR)</DialogTitle>
                <DialogDescription>
                  Send Monero to the address below to top up your balance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-secondary p-4 rounded-lg">
                  <code className="text-sm break-all">{fundingAddress}</code>
                </div>
                <Button className="w-full" onClick={() => copyToClipboard(fundingAddress)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Powered by{' '}
              <a href="https://sporestack.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                SporeStack
              </a>
            </p>
            <p className="mt-1">Anonymous VPS hosting with cryptocurrency payments</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VPS;

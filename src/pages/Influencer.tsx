import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, KeyRound, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Influencer() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length < 4) {
      setError('Please enter a valid voucher code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await api.validateVoucher(code.toUpperCase());
      
      if (result.valid) {
        navigate(`/influencer/${code.toUpperCase()}`);
      } else {
        setError('Invalid voucher code');
      }
    } catch (err) {
      setError('Failed to validate code');
      toast.error('Failed to validate voucher code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Influencer Dashboard</CardTitle>
          <CardDescription>
            Enter your voucher code to view your stats and earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="e.g. WH1T0XF4D8"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                className="font-mono text-center text-lg tracking-widest uppercase"
                maxLength={20}
                autoFocus
              />
              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || code.length < 4}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  View Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-muted-foreground text-sm">
              Your voucher code is your credential. No accounts, no passwords.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

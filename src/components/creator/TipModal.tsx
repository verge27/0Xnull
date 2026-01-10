import { useState } from 'react';
import { Heart, Loader2, Copy, Check, Clock, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreatorProfile } from '@/services/creatorApi';
import { toast } from 'sonner';

interface TipModalProps {
  creator: CreatorProfile;
  contentId?: string;
  trigger?: React.ReactNode;
}

const TIP_PRESETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1];

export const TipModal = ({ creator, contentId, trigger }: TipModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number>(0.05);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock payment address - would come from API
  const paymentAddress = '888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkRxbANsAnjyPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H';

  const handlePresetClick = (preset: number) => {
    setAmount(preset);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handleSendTip = () => {
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setShowPayment(true);
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(paymentAddress);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const checkPayment = async () => {
    setIsProcessing(true);
    // Simulate payment check
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    toast.success('Tip sent successfully! 🎉');
    setIsOpen(false);
    setShowPayment(false);
    setAmount(0.05);
    setMessage('');
  };

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShowPayment(false);
      setAmount(0.05);
      setMessage('');
      setCustomAmount('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Heart className="w-4 h-4" />
            Tip
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF6600]" />
            Send a Tip
          </DialogTitle>
          <DialogDescription>
            Show your appreciation to {creator.display_name}
          </DialogDescription>
        </DialogHeader>

        {!showPayment ? (
          <div className="space-y-4">
            {/* Preset amounts */}
            <div>
              <p className="text-sm font-medium mb-2">Quick amounts</p>
              <div className="grid grid-cols-3 gap-2">
                {TIP_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === preset && !customAmount ? 'default' : 'outline'}
                    onClick={() => handlePresetClick(preset)}
                    className={amount === preset && !customAmount ? 'bg-[#FF6600] hover:bg-[#FF6600]/90' : ''}
                  >
                    {preset} XMR
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <p className="text-sm font-medium mb-2">Custom amount</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  min="0.001"
                  step="0.001"
                />
                <span className="flex items-center text-muted-foreground">XMR</span>
              </div>
            </div>

            {/* Message (optional) */}
            <div>
              <p className="text-sm font-medium mb-2">Message (optional)</p>
              <Textarea
                placeholder="Say something nice..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length}/200 characters
              </p>
            </div>

            {/* Selected amount display */}
            <Card className="bg-[#FF6600]/5 border-[#FF6600]/20">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">You're sending</p>
                <p className="text-3xl font-bold text-[#FF6600]">{amount} XMR</p>
              </CardContent>
            </Card>

            {/* Send button */}
            <Button
              onClick={handleSendTip}
              className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
              size="lg"
              disabled={amount <= 0}
            >
              <Heart className="w-4 h-4 mr-2 fill-current" />
              Send Tip
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG
                value={`monero:${paymentAddress}?tx_amount=${amount}`}
                size={180}
                level="M"
              />
            </div>

            {/* Amount */}
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold text-[#FF6600]">{amount} XMR</p>
                {message && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    "{message}"
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Payment Address</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
                  {paymentAddress}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyAddress}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Expiry */}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Address valid for 30 minutes
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPayment(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={checkPayment}
                disabled={isProcessing}
                className="flex-1 bg-[#FF6600] hover:bg-[#FF6600]/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Payment'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import { MessageCircle, Loader2, Copy, Check, Clock, Send } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreatorProfile } from '@/services/creatorApi';
import { triggerCreatorNotification } from '@/hooks/useCreatorNotifications';
import { toast } from 'sonner';

interface PayPerMessageModalProps {
  creator: CreatorProfile;
  messageFee: number;
  isOpen: boolean;
  onClose: () => void;
  onMessageSent?: (message: string) => void;
}

export const PayPerMessageModal = ({ 
  creator, 
  messageFee, 
  isOpen, 
  onClose,
  onMessageSent 
}: PayPerMessageModalProps) => {
  const [message, setMessage] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock payment address - would come from API
  const paymentAddress = '888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkRxbANsAnjyPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H';

  const handleProceedToPayment = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
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
    
    // Trigger notification for creator
    triggerCreatorNotification(
      creator.id,
      'paid_message',
      'New Paid Message',
      `Someone sent you a paid message for ${messageFee} XMR`,
      { message: message.substring(0, 100), amount: messageFee }
    );
    
    toast.success('Message sent successfully! 🎉');
    onMessageSent?.(message);
    handleClose();
  };

  const handleClose = () => {
    setShowPayment(false);
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#FF6600]" />
            Send a Message
          </DialogTitle>
          <DialogDescription>
            Send a direct message to {creator.display_name} for {messageFee} XMR
          </DialogDescription>
        </DialogHeader>

        {!showPayment ? (
          <div className="space-y-4">
            {/* Message input */}
            <div>
              <p className="text-sm font-medium mb-2">Your message</p>
              <Textarea
                placeholder="Write your message to the creator..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {message.length}/500 characters
              </p>
            </div>

            {/* Fee display */}
            <Card className="bg-[#FF6600]/5 border-[#FF6600]/20">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Message fee</p>
                <p className="text-2xl font-bold text-[#FF6600]">{messageFee} XMR</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Set by creator • One-time payment
                </p>
              </CardContent>
            </Card>

            {/* Proceed button */}
            <Button
              onClick={handleProceedToPayment}
              className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
              size="lg"
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Proceed to Payment
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Message preview */}
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Your message:</p>
                <p className="text-sm italic">"{message}"</p>
              </CardContent>
            </Card>

            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG
                value={`monero:${paymentAddress}?tx_amount=${messageFee}`}
                size={160}
                level="M"
              />
            </div>

            {/* Amount */}
            <Card className="bg-[#FF6600]/5 border-[#FF6600]/20">
              <CardContent className="p-3 text-center">
                <p className="text-sm text-muted-foreground">Pay exactly</p>
                <p className="text-xl font-bold text-[#FF6600]">{messageFee} XMR</p>
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

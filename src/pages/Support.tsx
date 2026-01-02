import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const SIMPLEX_LINK = 'https://smp18.simplex.im/g#o0awCwkgXWzbKUyPb5Z-hOOWZAoghJl2SfyzOHv4Uas';

const Support = () => {
  useSEO();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Support</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Need help? We're here to assist you. Contact us through SimpleX for private, real-time support.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {/* SimpleX Support */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  SimpleX Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-center">
                  For real-time, private support, join our SimpleX group. Scan the QR code below.
                </p>
                
                {/* QR Code */}
                <div className="flex justify-center py-4">
                  <div className="p-4 bg-white rounded-xl">
                    <QRCodeSVG 
                      value={SIMPLEX_LINK}
                      size={180}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  No email support. Privacy by default.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <Card className="mt-8 border-border/50 bg-card/50 backdrop-blur-sm max-w-md mx-auto">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Before Contacting Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Check our <a href="/safety" className="text-primary hover:underline">Safety Guide</a> for common questions</li>
                <li>• Review our <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a></li>
                <li>• For order issues, have your order ID ready</li>
                <li>• Never share your private keys or recovery phrases with anyone</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Support;

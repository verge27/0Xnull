import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Shield, Lock, Wifi, Users, Globe, Download, HelpCircle, ExternalLink } from 'lucide-react';

const GrapheneOS = () => {
  const supportedDevices = [
    { name: 'Pixel 9a', support: 'April 2032', tier: '7-year' },
    { name: 'Pixel 9 / 9 Pro / 9 Pro XL / 9 Pro Fold', support: 'August 2031', tier: '7-year' },
    { name: 'Pixel 8a', support: 'May 2031', tier: '7-year' },
    { name: 'Pixel 8 / 8 Pro', support: 'October 2030', tier: '7-year' },
    { name: 'Pixel 7 / 7 Pro / 7a', support: '5 years', tier: '5-year' },
    { name: 'Pixel Fold / Tablet', support: '5 years', tier: '5-year' },
    { name: 'Pixel 6 / 6 Pro / 6a', support: 'Approaching EOL', tier: '5-year' },
  ];

  const faqs = [
    {
      question: 'Will my apps work?',
      answer: 'Yes. With sandboxed Google Play, the vast majority of apps work normally — including banking apps, ride-sharing, and anything requiring Google services.',
    },
    {
      question: 'Is it difficult to use?',
      answer: "No. It's Android. The interface is familiar. You're just removing the parts that work against you.",
    },
    {
      question: 'Can I go back to stock Android?',
      answer: 'Yes. Google provides a web flasher to restore stock OS if needed.',
    },
    {
      question: 'Does buying a used Pixel matter?',
      answer: 'No. The installation process cryptographically destroys all previous data by wiping the secure element. Used devices are fine.',
    },
    {
      question: 'What about updates?',
      answer: 'GrapheneOS provides updates faster than most manufacturers. Updates are automatic and seamless.',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
                <Smartphone className="w-3 h-3 mr-1" />
                Mobile Security
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Switch to <span className="text-gradient">GrapheneOS</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Your phone is infrastructure. Treat it like it.
              </p>
              <p className="text-muted-foreground">
                Most people obsess over passwords and 2FA, then run everything through a device that constantly phones home, grants apps permissions they shouldn't have, and trusts every network by default.
              </p>
              <p className="text-lg font-semibold text-primary mt-4">GrapheneOS fixes this.</p>
            </div>
          </div>
        </section>

        {/* What is GrapheneOS */}
        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">What is GrapheneOS?</h2>
              <p className="text-muted-foreground mb-4">
                GrapheneOS is a privacy and security-focused mobile operating system built on Android. It runs exclusively on Google Pixel devices — ironically, because Pixels have the best hardware security (Titan M chip, verified boot, 7-year update support).
              </p>
              <p className="text-muted-foreground">
                You keep full Android compatibility. Your apps still work. You just remove the surveillance layer.
              </p>
            </div>
          </div>
        </section>

        {/* Why Switch */}
        <section className="py-12 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Why Switch?</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Stock Android Problems
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold">Constant telemetry</p>
                      <p className="text-muted-foreground">Google services track location, app usage, and device data continuously</p>
                    </div>
                    <div>
                      <p className="font-semibold">Bloated attack surface</p>
                      <p className="text-muted-foreground">Carrier apps, OEM additions, and pre-installed software you can't remove</p>
                    </div>
                    <div>
                      <p className="font-semibold">Permissive by default</p>
                      <p className="text-muted-foreground">Apps get access they don't need</p>
                    </div>
                    <div>
                      <p className="font-semibold">Network trust</p>
                      <p className="text-muted-foreground">Your device trusts networks it shouldn't</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      GrapheneOS Solutions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold">No Google by default</p>
                      <p className="text-muted-foreground">Zero telemetry unless you choose to install Play services</p>
                    </div>
                    <div>
                      <p className="font-semibold">Sandboxed Google Play</p>
                      <p className="text-muted-foreground">Google apps run as regular apps with no special privileges</p>
                    </div>
                    <div>
                      <p className="font-semibold">Per-app network permission</p>
                      <p className="text-muted-foreground">Apps can't access the internet without explicit approval</p>
                    </div>
                    <div>
                      <p className="font-semibold">User profiles</p>
                      <p className="text-muted-foreground">Isolate work, personal, and sensitive apps separately</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Devices */}
        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Supported Devices</h2>
              
              <div className="space-y-4">
                {supportedDevices.map((device, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{device.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={device.tier === '7-year' ? 'default' : 'secondary'}>
                        {device.tier}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{device.support}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Card className="mt-6 border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="pt-6">
                  <p className="font-semibold text-yellow-500 mb-2">Critical requirement:</p>
                  <p className="text-muted-foreground">
                    <strong>Buy unlocked.</strong> Carrier-locked devices (common in the US) cannot have their bootloader unlocked. Purchase directly from Google Store or ensure the device is carrier-unlocked.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Used devices work perfectly — the installation process cryptographically wipes everything.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Installation */}
        <section className="py-12 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
                <Download className="w-6 h-6" />
                How to Install
              </h2>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">What you need:</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>A supported Pixel device</li>
                  <li>A computer with a modern browser (Chrome, Edge, Brave)</li>
                  <li>A USB cable (preferably the one that came with the phone)</li>
                  <li>15-30 minutes</li>
                </ul>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">1. Prepare the device</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Go to Settings → About phone</li>
                      <li>• Tap "Build number" 7 times to enable Developer options</li>
                      <li>• Go to Settings → System → Developer options</li>
                      <li>• Enable "OEM unlocking"</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">2. Boot to bootloader</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Power off the device</li>
                      <li>• Hold Volume Down + Power until you see "Fastboot Mode"</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">3. Run the web installer</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Visit <a href="https://grapheneos.org/install/web" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">grapheneos.org/install/web</a></li>
                      <li>• Connect your device via USB</li>
                      <li>• Follow the on-screen instructions</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">4. The installer will:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Unlock the bootloader (wipes device)</li>
                      <li>• Flash GrapheneOS</li>
                      <li>• Lock the bootloader (wipes device again)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">5. Set up your new device</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Complete initial setup</li>
                      <li>• Disable OEM unlocking when prompted</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <p className="text-center text-lg font-semibold text-primary mt-6">
                That's it. You now have a hardened device.
              </p>
            </div>
          </div>
        </section>

        {/* After Installation */}
        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">After Installation</h2>

              <h3 className="font-semibold mb-4">Installing apps:</h3>
              
              <div className="grid gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Badge>Option 1</Badge>
                      <div>
                        <p className="font-semibold">Sandboxed Google Play (recommended)</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Install from Settings → Apps → Google Play services. Apps work normally, including banking apps. Google services run without special privileges.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary">Option 2</Badge>
                      <div>
                        <p className="font-semibold">Aurora Store</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Anonymous access to Play Store apps. No Google account required.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">Option 3</Badge>
                      <div>
                        <p className="font-semibold">F-Droid / Obtainium</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Open source apps only. Maximum privacy.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <h3 className="font-semibold mb-4">Recommended setup for sensitive use:</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Create a secondary profile</strong> for sensitive apps (banking, trading, authenticators)</li>
                <li><strong className="text-foreground">Keep your main profile minimal</strong> — daily use apps only</li>
                <li><strong className="text-foreground">Use the "End session" feature</strong> to fully lock profiles when not in use</li>
                <li><strong className="text-foreground">Disable network permission</strong> for apps that don't need internet</li>
              </ol>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
                <HelpCircle className="w-6 h-6" />
                Common Questions
              </h2>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <p className="font-semibold mb-2">{faq.question}</p>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Line */}
        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">The Bottom Line</h2>
              <p className="text-muted-foreground mb-4">
                Your phone sees everything — messages, locations, financial apps, authentication codes. Stock Android treats this data as a product to monetise and a surface to exploit.
              </p>
              <p className="text-muted-foreground mb-6">
                GrapheneOS treats your phone like what it is: critical infrastructure that should be hardened, not harvested.
              </p>
              <p className="text-lg font-semibold text-primary mb-8">
                The install takes 15 minutes. The privacy lasts as long as you use it.
              </p>
              <a
                href="https://grapheneos.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Learn more at grapheneos.org
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GrapheneOS;

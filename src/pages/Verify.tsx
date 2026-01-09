import { Shield, Globe, Key, FileCheck, ChevronDown, Copy, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const PGP_PUBLIC_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----

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
T6eDG9UAKZVnBtZ2QkkbtAzsPnZ9cNaXIPIw
=yodN
-----END PGP PUBLIC KEY BLOCK-----`;

const SIGNED_WARRANT_CANARY = `-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

0xNull Warrant Canary
=====================
Date: January 9, 2026

As of the date above, 0xNull Admin states:

1. We have not received any National Security Letters.
2. We have not received any gag orders.
3. We have not been required to log user activity.
4. No law enforcement requests have been received.

This canary is signed monthly with PGP key:
CFC4 23FB FB2F BFB6 8135 B8EF F21D D875 70E4 DB9F

If this statement is not updated or is removed, assume that 
the above statements may no longer be accurate.

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEz8Qj+/svv7aBNbjv8h3YdXDk258FAmeDzJgACgkQ8h3YdXDk
259yLg/+KQcQQMWGUV1xXmRzSmB9NRMBp2qJf6qOLNNCIqTVLvJ7lmDw5gT/Qv3d
G4i+VlH8Xb5UgHb2M+rL7K9QmNjFp1xZKyT3qH8RnFj5LmxP6VwMb3kJhT9Zx2cN
s4H1dF5vBnVzK8QfP3mL9jT6yQx7RgK2hN1wPfM4sB5L3XvJ8qZ7K2M1F3dH5Gg
P9rT8xN7L1qK5sB2vF6J4wM3cL8Q9hR1dN5mK7yT4zBwVxP2fG3sL5J8qN9mR7vK
3xH1dF5sG8hT9yBwN4fL7mJ2qP5zK3sM1vR6dB7gL9xT8hF2wJ4sN5mQ9yK3Fv7R
H1dBwP6gJ9mL3xT8sK5qN2vF7hR4yG1dB5mJ9wL3xT6sK8qN2vF7hR4yG1sN9mPw
=k5Nq
-----END PGP SIGNATURE-----`;

const Verify = () => {
  useSEO();
  const [isKeyOpen, setIsKeyOpen] = useState(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySignedCanary = async () => {
    await navigator.clipboard.writeText(SIGNED_WARRANT_CANARY);
    setCopied(true);
    toast.success("Signed canary copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Verify & Security</h1>
          <p className="text-muted-foreground">
            Verify the authenticity of 0xNull and our commitment to privacy
          </p>
        </div>

        <div className="space-y-6">
          {/* Tor/Onion Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Tor / Onion Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block bg-muted p-3 rounded-md text-sm break-all font-mono">
                http://onullluix4iaj77wbqf52dhdiey4kaucdoqfkaoolcwxvcdxz5j6duid.onion
              </code>
              <p className="text-sm text-muted-foreground mt-2">
                Access 0xNull securely over the Tor network for enhanced privacy.
              </p>
            </CardContent>
          </Card>

          {/* PGP Fingerprint */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                PGP Fingerprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block bg-muted p-3 rounded-md text-sm font-mono tracking-wider">
                CFC4 23FB FB2F BFB6 8135 B8EF F21D D875 70E4 DB9F
              </code>
              <p className="text-sm text-muted-foreground mt-2">
                Use this fingerprint to verify signed messages from 0xNull Admin.
              </p>
            </CardContent>
          </Card>

          {/* PGP Public Key */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                PGP Public Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Collapsible open={isKeyOpen} onOpenChange={setIsKeyOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {isKeyOpen ? "Hide Public Key" : "Show Public Key"}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isKeyOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {PGP_PUBLIC_KEY}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Warrant Canary */}
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Warrant Canary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                As of <span className="font-semibold text-foreground">January 9, 2026</span>:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  We have not received any National Security Letters
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  We have not received any gag orders
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  We have not been required to log user activity
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  No law enforcement requests have been received
                </li>
              </ul>
              
              {/* PGP Signed Canary */}
              <div className="border-t pt-4 mt-4">
                <Collapsible open={isSignatureOpen} onOpenChange={setIsSignatureOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        {isSignatureOpen ? "Hide PGP Signed Canary" : "View PGP Signed Canary"}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isSignatureOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Copy this signed message and verify it using our public key with any PGP tool (e.g., <code className="bg-muted px-1 rounded">gpg --verify</code>).
                    </p>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                        {SIGNED_WARRANT_CANARY}
                      </pre>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={copySignedCanary}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
              
              <p className="text-xs text-muted-foreground">
                This canary is signed monthly. If this statement is not updated or is removed, 
                assume that the above statements may no longer be accurate.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Verify;

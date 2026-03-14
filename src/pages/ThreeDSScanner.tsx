import { useState, useCallback, useRef } from 'react';
import { Shield, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScanForm } from '@/components/3ds/ScanForm';
import { ScanProgress } from '@/components/3ds/ScanProgress';
import { VerdictCard } from '@/components/3ds/VerdictCard';
import { EvidencePanel } from '@/components/3ds/EvidencePanel';

const RATE_LIMIT_KEY = '3ds_scan_history';
const MAX_SCANS = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface ScanResult {
  status: string;
  verdict: {
    likely_skips_3ds: boolean | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    positive_indicators: string[];
    negative_indicators: string[];
  };
  scan_data: {
    start_url: string;
    checkout_page_url: string;
    payment_page_reached: boolean;
    auth_wall_detected: boolean;
    bin_trigger_psp: string | null;
    bin_trigger_card_prefix: string | null;
    state_log: string[];
    screenshots: Record<string, string>;
  };
  timestamp: string;
}

function getRateLimitState() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { timestamps: [] as number[] };
    const data = JSON.parse(raw) as { timestamps: number[] };
    const now = Date.now();
    data.timestamps = data.timestamps.filter((t) => now - t < WINDOW_MS);
    return data;
  } catch {
    return { timestamps: [] as number[] };
  }
}

function recordScan() {
  const state = getRateLimitState();
  state.timestamps.push(Date.now());
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
}

const ThreeDSScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [currentState, setCurrentState] = useState<string | null>(null);
  const [stateMessage, setStateMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const rateLimitState = getRateLimitState();
  const scansRemaining = Math.max(0, MAX_SCANS - rateLimitState.timestamps.length);
  const rateLimitResetTime =
    rateLimitState.timestamps.length >= MAX_SCANS
      ? rateLimitState.timestamps[0] + WINDOW_MS
      : null;

  const handleScan = useCallback(async (url: string) => {
    setIsScanning(true);
    setResult(null);
    setError(null);
    setCurrentState('LAUNCHING');
    setStateMessage('Initializing headless browser...');

    abortRef.current = new AbortController();

    try {
      const res = await fetch('https://api.0xnull.io/api/3ds/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_url: url }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';

      // SSE stream
      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let eventType = '';
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              try {
                const parsed = JSON.parse(data);
                if (eventType === 'state') {
                  setCurrentState(parsed.state);
                  setStateMessage(parsed.message);
                } else if (eventType === 'complete') {
                  recordScan();
                  setResult(parsed);
                }
              } catch { /* skip malformed */ }
              eventType = '';
            }
          }
        }
      } else {
        // JSON polling fallback
        const data = await res.json();
        if (data.scan_id) {
          // Poll
          let attempts = 0;
          while (attempts < 30) {
            await new Promise((r) => setTimeout(r, 5000));
            const poll = await fetch(`https://api.0xnull.io/api/3ds/scan/${data.scan_id}`, {
              signal: abortRef.current?.signal,
            });
            const pollData = await poll.json();
            if (pollData.state) {
              setCurrentState(pollData.state);
              setStateMessage(pollData.message || null);
            }
            if (pollData.status === 'complete') {
              recordScan();
              setResult(pollData);
              break;
            }
            attempts++;
          }
        } else {
          // Direct result
          recordScan();
          setResult(data);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Scan failed. Please try again.');
      }
    } finally {
      setIsScanning(false);
      setCurrentState(null);
      setStateMessage(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-muted-foreground text-sm font-mono">
            <Shield className="w-4 h-4" />
            <span>3DS Risk Intelligence</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            3DS Checkout Risk Scanner
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Test whether an e-commerce checkout enforces 3D Secure authentication. Free. No account required.
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Enter a merchant URL and we'll navigate their checkout flow — product selection, cart, guest checkout,
            payment page — and determine whether 3DS is triggered. Results include a confidence-rated verdict,
            screenshots of every checkout stage, and a full state transition log.
          </p>
        </div>
      </section>

      {/* Scanner */}
      <section className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <ScanForm
          onSubmit={handleScan}
          isScanning={isScanning}
          scansRemaining={scansRemaining}
          rateLimitResetTime={rateLimitResetTime}
        />

        {/* Progress */}
        {isScanning && (
          <ScanProgress currentState={currentState} message={stateMessage} />
        )}

        {/* Error */}
        {error && (
          <div className="text-center p-6 rounded-lg border border-destructive/30 bg-destructive/10">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <VerdictCard
              likelySkips3ds={result.verdict.likely_skips_3ds}
              confidence={result.verdict.confidence}
              psp={result.scan_data.bin_trigger_psp}
              targetUrl={result.scan_data.start_url}
              timestamp={result.timestamp}
            />
            <EvidencePanel
              positiveIndicators={result.verdict.positive_indicators}
              negativeIndicators={result.verdict.negative_indicators}
              stateLog={result.scan_data.state_log}
              screenshots={result.scan_data.screenshots}
              paymentPageReached={result.scan_data.payment_page_reached}
              authWallDetected={result.scan_data.auth_wall_detected}
              binTriggerPsp={result.scan_data.bin_trigger_psp}
              binTriggerCardPrefix={result.scan_data.bin_trigger_card_prefix}
            />
          </div>
        )}
      </section>

      {/* Footer note */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          This tool is for security research and merchant self-assessment. It navigates public checkout flows using
          test cards and does not submit any transactions.{' '}
          <a
            href="https://github.com/verge27/3DS-Checkout-Risk-Intelligence-Platform"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            Source code on GitHub <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </section>

      <Footer />
    </div>
  );
};

export default ThreeDSScanner;

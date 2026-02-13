import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Copy, Check, Download, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface TokenSecurityPanelProps {
  token: string;
}

const BACKUP_KEY = 'oxnull_backup_ack';

export const TokenSecurityPanel = ({ token }: TokenSecurityPanelProps) => {
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [backupAcknowledged, setBackupAcknowledged] = useState(
    () => localStorage.getItem(BACKUP_KEY) === 'true'
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success('Token copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([token], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '0xnull-token.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Token file downloaded');
  };

  const handleAcknowledgeBackup = () => {
    localStorage.setItem(BACKUP_KEY, 'true');
    setBackupAcknowledged(true);
    toast.success('Backup acknowledged');
  };

  return (
    <div className="space-y-4">
      {/* Backup warning */}
      {!backupAcknowledged && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-300">Your token has not been backed up</p>
              <p className="text-sm text-amber-400/80 mt-1">If you lose it, your funds are gone forever. There is no recovery.</p>
              <Button size="sm" variant="outline" className="mt-3 text-xs border-amber-500/30 hover:bg-amber-500/10" onClick={handleAcknowledgeBackup}>
                I've backed it up
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" /> Token Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token display */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Your Token</p>
            <div className="flex gap-2">
              <Input
                value={showToken ? token : '•'.repeat(40)}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={() => setShowToken(!showToken)}>
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* QR Code */}
          {showToken && (
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG value={token} size={160} />
            </div>
          )}

          {/* Export */}
          <Button variant="outline" onClick={handleDownload} className="w-full gap-2">
            <Download className="w-4 h-4" /> Download as text file
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

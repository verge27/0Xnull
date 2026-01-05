import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, RefreshCw, Zap, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface CronJobStatus {
  jobId: number;
  jobName: string;
  schedule: string;
  lastRun: string | null;
  lastStatus: 'succeeded' | 'failed' | 'running' | null;
  nextRun: string | null;
}

interface ResolutionStatusPanelProps {
  onManualTrigger?: () => void;
}

export function ResolutionStatusPanel({ onManualTrigger }: ResolutionStatusPanelProps) {
  const [cronStatus, setCronStatus] = useState<CronJobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  const fetchCronStatus = async () => {
    setLoading(true);
    try {
      // Query cron job status - this will work if the user has proper permissions
      const { data: jobData, error: jobError } = await supabase
        .rpc('get_cron_job_status' as any)
        .select('*');
      
      if (jobError) {
        console.log('Cron status RPC not available, using fallback');
        // Fallback: just show static info
        setCronStatus([
          {
            jobId: 5,
            jobName: 'resolve-sports-markets-every-15-min',
            schedule: '*/15 * * * *',
            lastRun: null,
            lastStatus: null,
            nextRun: getNextCronRun('*/15 * * * *'),
          },
          {
            jobId: 4,
            jobName: 'auto-resolve-markets-cron',
            schedule: '*/5 * * * *',
            lastRun: null,
            lastStatus: null,
            nextRun: getNextCronRun('*/5 * * * *'),
          },
        ]);
      } else if (jobData) {
        setCronStatus(jobData);
      }
    } catch (err) {
      console.error('Error fetching cron status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simple next cron run calculator for common patterns
  const getNextCronRun = (schedule: string): string => {
    const now = new Date();
    if (schedule === '*/15 * * * *') {
      const mins = now.getMinutes();
      const nextMins = Math.ceil(mins / 15) * 15;
      const next = new Date(now);
      next.setMinutes(nextMins === 60 ? 0 : nextMins);
      next.setSeconds(0);
      if (nextMins === 60) next.setHours(next.getHours() + 1);
      return next.toISOString();
    }
    if (schedule === '*/5 * * * *') {
      const mins = now.getMinutes();
      const nextMins = Math.ceil(mins / 5) * 5;
      const next = new Date(now);
      next.setMinutes(nextMins === 60 ? 0 : nextMins);
      next.setSeconds(0);
      if (nextMins === 60) next.setHours(next.getHours() + 1);
      return next.toISOString();
    }
    return now.toISOString();
  };

  useEffect(() => {
    fetchCronStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCronStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualTrigger = async (functionName: string) => {
    setTriggering(functionName);
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { manual: true, time: new Date().toISOString() },
      });
      
      if (error) {
        toast.error(`Failed to trigger ${functionName}: ${error.message}`);
      } else {
        toast.success(`${functionName} triggered successfully`);
        onManualTrigger?.();
        // Refresh status after a short delay
        setTimeout(fetchCronStatus, 2000);
      }
    } catch (err) {
      toast.error(`Error triggering ${functionName}`);
    } finally {
      setTriggering(null);
    }
  };

  const getStatusIcon = (status: string | null) => {
    if (status === 'succeeded') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === 'running') return <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string | null) => {
    if (status === 'succeeded') return <Badge variant="outline" className="border-emerald-500 text-emerald-500">Success</Badge>;
    if (status === 'failed') return <Badge variant="outline" className="border-red-500 text-red-500">Failed</Badge>;
    if (status === 'running') return <Badge variant="outline" className="border-amber-500 text-amber-500">Running</Badge>;
    return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Unknown</Badge>;
  };

  const formatSchedule = (schedule: string) => {
    if (schedule === '*/15 * * * *') return 'Every 15 minutes';
    if (schedule === '*/5 * * * *') return 'Every 5 minutes';
    if (schedule === '0 * * * *') return 'Every hour';
    return schedule;
  };

  const jobInfo: Record<string, { label: string; description: string; function: string }> = {
    'resolve-sports-markets-every-15-min': {
      label: 'Sports Resolution',
      description: 'Auto-resolves completed sports matches',
      function: 'resolve-sports-markets',
    },
    'auto-resolve-markets-cron': {
      label: 'General Resolution',
      description: 'Resolves prediction markets',
      function: 'auto-resolve-markets',
    },
  };

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-zinc-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading Resolution Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-zinc-700/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Auto-Resolution Status
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchCronStatus} className="h-7 px-2">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {cronStatus.map((job) => {
          const info = jobInfo[job.jobName] || { 
            label: job.jobName, 
            description: '', 
            function: job.jobName.replace('-every-15-min', '').replace('-cron', '') 
          };
          const nextRun = job.nextRun || getNextCronRun(job.schedule);
          
          return (
            <div key={job.jobId} className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(job.lastStatus)}
                  <span className="font-medium text-sm">{info.label}</span>
                </div>
                {getStatusBadge(job.lastStatus)}
              </div>
              
              <p className="text-xs text-muted-foreground">{info.description}</p>
              
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatSchedule(job.schedule)}
                </div>
                {job.lastRun && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Last: {formatDistanceToNow(new Date(job.lastRun), { addSuffix: true })}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground">
                  Next run: {format(new Date(nextRun), 'HH:mm')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleManualTrigger(info.function)}
                  disabled={triggering === info.function}
                >
                  {triggering === info.function ? (
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Zap className="w-3 h-3 mr-1" />
                  )}
                  Run Now
                </Button>
              </div>
            </div>
          );
        })}
        
        <p className="text-xs text-muted-foreground text-center pt-2">
          Markets are automatically resolved when match results are available
        </p>
      </CardContent>
    </Card>
  );
}

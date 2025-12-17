import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { usePrivateKeyAuth } from "@/hooks/usePrivateKeyAuth";
import { useAuth } from "@/hooks/useAuth";
import { ResolutionInfo } from "@/components/ResolutionBadge";
import { fixName } from "@/lib/nameFixes";

interface CreateFightMarketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fighter1: string;
  fighter2: string;
  eventName: string;
  eventDate: string;
  resolution?: 'auto' | 'manual';
  promotionName?: string;
  onMarketCreated?: () => void;
}

export function CreateFightMarketDialog({
  open,
  onOpenChange,
  fighter1,
  fighter2,
  eventName,
  eventDate,
  resolution,
  promotionName,
  onMarketCreated,
}: CreateFightMarketDialogProps) {
  const [creating, setCreating] = useState(false);
  const [resolutionDate, setResolutionDate] = useState<Date>(() => {
    // Try to parse the event date, default to 7 days from now
    const parsed = new Date(eventDate);
    return isNaN(parsed.getTime()) ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : parsed;
  });
  
  const { privateKeyUser } = usePrivateKeyAuth();
  const { user } = useAuth();

  const generateQuestion = () => {
    return `Will ${fixName(fighter1)} defeat ${fixName(fighter2)} at ${fixName(eventName)}?`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!privateKeyUser && !user) {
      toast.error("Please sign in to create a market");
      return;
    }

    if (!resolutionDate) {
      toast.error("Please select a resolution date");
      return;
    }

    setCreating(true);
    try {
      const question = generateQuestion();
      const description = `Market resolves YES if ${fixName(fighter1)} wins the fight against ${fixName(fighter2)} at ${fixName(eventName)}. Resolves NO if ${fixName(fighter2)} wins. Draw or No Contest will result in refunds.`;

      const { data, error } = await supabase
        .from('prediction_markets')
        .insert({
          question,
          description,
          resolution_criteria: `Official result from ${promotionName || 'the promotion'}. ${resolution === 'auto' ? 'Auto-resolved via Tapology within 24-48 hours.' : 'Manually verified within 1-7 days.'}`,
          resolution_date: resolutionDate.toISOString(),
          status: 'open',
          creator_id: user?.id || null,
          creator_pk_id: privateKeyUser?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Market created successfully!");
      onOpenChange(false);
      onMarketCreated?.();
    } catch (error) {
      console.error('Failed to create market:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create market");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Fight Market</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">{fixName(eventName)}</p>
            <p className="text-lg font-bold">
              <span className="text-red-400">{fixName(fighter1)}</span>
              <span className="text-muted-foreground mx-2">vs</span>
              <span className="text-blue-400">{fixName(fighter2)}</span>
            </p>
            <p className="text-sm text-muted-foreground">{eventDate}</p>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <Label className="text-sm text-muted-foreground">Market Question</Label>
            <p className="font-medium mt-1">{generateQuestion()}</p>
          </div>

          <ResolutionInfo resolution={resolution} promotionName={promotionName} />

          <div className="space-y-2">
            <Label>Resolution Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !resolutionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {resolutionDate ? format(resolutionDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={resolutionDate}
                  onSelect={setResolutionDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Set to after the event ends. {resolution === 'auto' ? 'Auto-resolves within 24-48h.' : 'Manual verification within 1-7 days.'}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-red-600 hover:bg-red-700" 
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Market"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

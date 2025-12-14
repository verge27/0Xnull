import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

const ORACLE_ASSETS = [
  "BTC", "ETH", "SOL", "XMR", "LTC", "DASH", "ZEC", "ARRR",
  "DOGE", "SHIB", "PEPE", "BONK", "FARTCOIN", "ADA", "AVAX",
  "DOT", "ATOM", "NEAR", "LINK", "UNI", "AAVE"
];

interface CreateMarketDialogProps {
  onMarketCreated: () => void;
}

export function CreateMarketDialog({ onMarketCreated }: CreateMarketDialogProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [resolutionDate, setResolutionDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    oracle_asset: "",
    oracle_condition: "above" as "above" | "below",
    oracle_value: "",
  });

  const generateMarketId = () => {
    const asset = formData.oracle_asset.toLowerCase();
    const value = formData.oracle_value.replace(/[^0-9]/g, '');
    const condition = formData.oracle_condition;
    const dateStr = resolutionDate ? format(resolutionDate, "MMMdd").toLowerCase() : "tbd";
    return `${asset}_${condition}_${value}_${dateStr}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.oracle_asset || !formData.oracle_value || !resolutionDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const oracleValue = parseFloat(formData.oracle_value);
    if (isNaN(oracleValue) || oracleValue <= 0) {
      toast.error("Please enter a valid target price");
      return;
    }

    setCreating(true);
    try {
      const marketId = generateMarketId();
      const resolutionTime = Math.floor(resolutionDate.getTime() / 1000);

      await api.createMarket({
        market_id: marketId,
        title: formData.title || `Will ${formData.oracle_asset} be ${formData.oracle_condition} $${oracleValue.toLocaleString()} on ${format(resolutionDate, "MMM d, yyyy")}?`,
        description: formData.description || `Resolves YES if ${formData.oracle_asset}/USD price is ${formData.oracle_condition} $${oracleValue.toLocaleString()} at resolution time`,
        oracle_type: "price",
        oracle_asset: formData.oracle_asset,
        oracle_condition: formData.oracle_condition,
        oracle_value: oracleValue,
        resolution_time: resolutionTime,
      });

      toast.success("Market created successfully!");
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        oracle_asset: "",
        oracle_condition: "above",
        oracle_value: "",
      });
      setResolutionDate(undefined);
      onMarketCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create market");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Market
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Prediction Market</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Asset *</Label>
              <Select
                value={formData.oracle_asset}
                onValueChange={(value) => setFormData({ ...formData, oracle_asset: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {ORACLE_ASSETS.map((asset) => (
                    <SelectItem key={asset} value={asset}>
                      {asset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condition *</Label>
              <Select
                value={formData.oracle_condition}
                onValueChange={(value: "above" | "below") => 
                  setFormData({ ...formData, oracle_condition: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="below">Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Price (USD) *</Label>
            <Input
              type="number"
              placeholder="e.g. 100000"
              value={formData.oracle_value}
              onChange={(e) => setFormData({ ...formData, oracle_value: e.target.value })}
            />
          </div>

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
          </div>

          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input
              placeholder="Auto-generated if empty"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Auto-generated if empty"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? "Creating..." : "Create Market"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

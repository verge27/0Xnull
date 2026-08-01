import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  url: z.string().trim().url("Must be a valid URL").max(500),
  onionAddress: z.string().trim().max(120).optional().or(z.literal("")),
  category: z.string().trim().min(2, "Category is required").max(60),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

const initialState = {
  name: "",
  url: "",
  onionAddress: "",
  category: "",
  description: "",
  reason: "",
};

export function SubmitLinkForm() {
  const [values, setValues] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof initialState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-link-suggestion", {
        body: parsed.data,
      });
      if (error) throw error;
      toast.success("Link submitted for review. Thanks!");
      setValues(initialState);
    } catch (err) {
      console.error(err);
      toast.error("Could not submit the link. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a Link</CardTitle>
        <CardDescription>
          Know a privacy resource worth listing? Send it in and an admin will review it before it appears here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="link-name" className="text-sm font-medium mb-2 block">Name</label>
              <Input id="link-name" placeholder="Resource name" value={values.name} onChange={set("name")} maxLength={100} />
            </div>
            <div>
              <label htmlFor="link-category" className="text-sm font-medium mb-2 block">Category</label>
              <Input id="link-category" placeholder="Directory, Forum, Search Engine" value={values.category} onChange={set("category")} maxLength={60} />
            </div>
          </div>

          <div>
            <label htmlFor="link-url" className="text-sm font-medium mb-2 block">URL</label>
            <Input id="link-url" placeholder="https://example.com" value={values.url} onChange={set("url")} maxLength={500} />
          </div>

          <div>
            <label htmlFor="link-onion" className="text-sm font-medium mb-2 block">Onion address (optional)</label>
            <Input id="link-onion" placeholder="example.onion" value={values.onionAddress} onChange={set("onionAddress")} maxLength={120} className="font-mono" />
          </div>

          <div>
            <label htmlFor="link-description" className="text-sm font-medium mb-2 block">Description</label>
            <Textarea id="link-description" rows={3} placeholder="What does this resource do?" value={values.description} onChange={set("description")} maxLength={1000} />
          </div>

          <div>
            <label htmlFor="link-reason" className="text-sm font-medium mb-2 block">Why should we list it? (optional)</label>
            <Textarea id="link-reason" rows={3} placeholder="How it aligns with privacy-first values" value={values.reason} onChange={set("reason")} maxLength={1000} />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit for Review
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

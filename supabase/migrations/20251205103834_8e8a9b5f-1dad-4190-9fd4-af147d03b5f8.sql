-- Create table for API call tracking
CREATE TABLE public.api_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_call_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for admin dashboard (you can restrict this later)
CREATE POLICY "Anyone can view API logs" ON public.api_call_logs
  FOR SELECT USING (true);

-- Service role can insert logs (edge functions use service role)
CREATE POLICY "Service role can insert logs" ON public.api_call_logs
  FOR INSERT WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_api_call_logs_function_name ON public.api_call_logs(function_name);
CREATE INDEX idx_api_call_logs_created_at ON public.api_call_logs(created_at DESC);
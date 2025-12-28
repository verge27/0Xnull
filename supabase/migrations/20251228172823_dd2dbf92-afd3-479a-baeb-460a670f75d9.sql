-- Create trigger function that fires when order status changes to 'paid' or later
CREATE OR REPLACE FUNCTION public.auto_record_listing_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only record when status changes to 'paid' or later
  -- and wasn't already in that state (prevents double-counting)
  IF NEW.status IN ('paid', 'shipped', 'delivered', 'completed') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('paid', 'shipped', 'delivered', 'completed'))
     AND NEW.listing_id IS NOT NULL THEN
    
    INSERT INTO listing_analytics (listing_id, date, sales, revenue)
    VALUES (NEW.listing_id, CURRENT_DATE, NEW.quantity, NEW.total_price_usd)
    ON CONFLICT (listing_id, date) 
    DO UPDATE SET 
      sales = listing_analytics.sales + NEW.quantity,
      revenue = listing_analytics.revenue + NEW.total_price_usd;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS record_sale_on_payment ON public.orders;

CREATE TRIGGER record_sale_on_payment
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_record_listing_sale();
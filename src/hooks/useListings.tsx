import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DbListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price_usd: number;
  category: string;
  secondary_category: string | null;
  tertiary_category: string | null;
  images: string[];
  stock: number;
  shipping_price_usd: number;
  shipping_countries: string[] | null;
  status: string;
  condition: string;
  created_at: string;
  updated_at: string;
  views: number;
}

export interface CreateListingInput {
  title: string;
  description: string;
  price_usd: number;
  category: string;
  secondary_category?: string | null;
  tertiary_category?: string | null;
  images?: string[];
  stock: number;
  shipping_price_usd: number;
  shipping_countries?: string[] | null;
  condition?: string;
  status?: string;
}

export interface ListingError {
  code: 'AUTH' | 'NETWORK' | 'VALIDATION' | 'SERVER' | 'NOT_FOUND' | 'UNKNOWN';
  message: string;
  details?: string;
}

export interface ListingResult<T> {
  data: T | null;
  error: ListingError | null;
}

export const useListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<DbListing[]>([]);
  const [userListings, setUserListings] = useState<DbListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationError, setOperationError] = useState<ListingError | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check session validity before operations
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useListings] Error fetching listings:', error);
      } else {
        setListings(data || []);
      }
    } catch (err) {
      console.error('[useListings] Exception fetching listings:', err);
    }
    setLoading(false);
  };

  const fetchUserListings = async () => {
    if (!user) {
      setUserListings([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useListings] Error fetching user listings:', error);
      } else {
        setUserListings(data || []);
      }
    } catch (err) {
      console.error('[useListings] Exception fetching user listings:', err);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    fetchUserListings();
  }, [user]);

  const createListing = async (input: CreateListingInput): Promise<DbListing | null> => {
    setOperationError(null);
    setIsCreating(true);

    // Check auth first
    const isValid = await checkSession();
    if (!isValid || !user) {
      const error: ListingError = {
        code: 'AUTH',
        message: 'Please sign in to create a listing',
        details: 'Your session has expired'
      };
      setOperationError(error);
      setIsCreating(false);
      toast.error(error.message);
      return null;
    }

    // Validate input
    if (!input.title?.trim()) {
      const error: ListingError = {
        code: 'VALIDATION',
        message: 'Title is required'
      };
      setOperationError(error);
      setIsCreating(false);
      toast.error(error.message);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: input.title.trim(),
          description: input.description?.trim() || '',
          price_usd: input.price_usd,
          category: input.category,
          secondary_category: input.secondary_category || null,
          tertiary_category: input.tertiary_category || null,
          images: input.images || [],
          stock: input.stock,
          shipping_price_usd: input.shipping_price_usd,
          shipping_countries: input.shipping_countries || null,
          condition: input.condition || 'new',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('[useListings] Error creating listing:', error);

        let listingError: ListingError;

        if (error.code === '23505') {
          listingError = {
            code: 'VALIDATION',
            message: 'A listing with this title already exists',
            details: error.message
          };
        } else if (error.code === '42501') {
          listingError = {
            code: 'AUTH',
            message: 'Permission denied - try signing out and back in',
            details: error.message
          };
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          listingError = {
            code: 'NETWORK',
            message: 'Network error - check your connection',
            details: error.message
          };
        } else {
          listingError = {
            code: 'SERVER',
            message: 'Failed to create listing - please try again',
            details: error.message
          };
        }

        setOperationError(listingError);
        setIsCreating(false);
        toast.error(listingError.message);
        return null;
      }

      // Refresh user listings (don't fail if this fails)
      try {
        await fetchUserListings();
      } catch (refreshError) {
        console.warn('[useListings] Failed to refresh listings after create:', refreshError);
      }

      setIsCreating(false);
      return data;
    } catch (err: any) {
      console.error('[useListings] Exception creating listing:', err);
      const listingError: ListingError = {
        code: 'UNKNOWN',
        message: 'Something went wrong - please try again',
        details: err.message
      };
      setOperationError(listingError);
      setIsCreating(false);
      toast.error(listingError.message);
      return null;
    }
  };

  const createManyListings = async (inputs: CreateListingInput[]): Promise<number> => {
    if (!user) {
      toast.error('You must be logged in to create listings');
      return 0;
    }

    const listings = inputs.map(input => ({
      seller_id: user.id,
      title: input.title,
      description: input.description,
      price_usd: input.price_usd,
      category: input.category,
      secondary_category: input.secondary_category || null,
      tertiary_category: input.tertiary_category || null,
      images: input.images || [],
      stock: input.stock,
      shipping_price_usd: input.shipping_price_usd,
      shipping_countries: input.shipping_countries || null,
      condition: input.condition || 'new',
      status: 'active'
    }));

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert(listings)
        .select();

      if (error) {
        console.error('[useListings] Error creating listings:', error);
        toast.error('Failed to import listings');
        return 0;
      }

      await fetchUserListings();
      return data?.length || 0;
    } catch (err) {
      console.error('[useListings] Exception creating listings:', err);
      toast.error('Failed to import listings');
      return 0;
    }
  };

  const updateListing = async (id: string, updates: Partial<CreateListingInput>): Promise<boolean> => {
    setOperationError(null);
    setIsUpdating(true);

    // Check auth first
    const isValid = await checkSession();
    if (!isValid) {
      const error: ListingError = {
        code: 'AUTH',
        message: 'Please sign in to update this listing',
        details: 'Your session has expired'
      };
      setOperationError(error);
      setIsUpdating(false);
      toast.error(error.message);
      return false;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('[useListings] Error updating listing:', error);

        let listingError: ListingError;
        if (error.code === '42501') {
          listingError = {
            code: 'AUTH',
            message: 'Permission denied - you can only edit your own listings',
            details: error.message
          };
        } else if (error.message?.includes('network')) {
          listingError = {
            code: 'NETWORK',
            message: 'Network error - check your connection',
            details: error.message
          };
        } else {
          listingError = {
            code: 'SERVER',
            message: 'Failed to update listing',
            details: error.message
          };
        }

        setOperationError(listingError);
        setIsUpdating(false);
        toast.error(listingError.message);
        return false;
      }

      await fetchUserListings();
      setIsUpdating(false);
      return true;
    } catch (err: any) {
      console.error('[useListings] Exception updating listing:', err);
      setOperationError({
        code: 'UNKNOWN',
        message: 'Something went wrong - please try again',
        details: err.message
      });
      setIsUpdating(false);
      toast.error('Failed to update listing');
      return false;
    }
  };

  const deleteListing = async (id: string): Promise<boolean> => {
    setOperationError(null);
    setIsDeleting(true);

    // Check auth first
    const isValid = await checkSession();
    if (!isValid) {
      const error: ListingError = {
        code: 'AUTH',
        message: 'Please sign in to delete this listing',
        details: 'Your session has expired'
      };
      setOperationError(error);
      setIsDeleting(false);
      toast.error(error.message);
      return false;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useListings] Error deleting listing:', error);
        setOperationError({
          code: 'SERVER',
          message: 'Failed to delete listing',
          details: error.message
        });
        setIsDeleting(false);
        toast.error('Failed to delete listing');
        return false;
      }

      await fetchUserListings();
      setIsDeleting(false);
      return true;
    } catch (err: any) {
      console.error('[useListings] Exception deleting listing:', err);
      setOperationError({
        code: 'UNKNOWN',
        message: 'Something went wrong - please try again',
        details: err.message
      });
      setIsDeleting(false);
      toast.error('Failed to delete listing');
      return false;
    }
  };

  return {
    listings,
    userListings,
    loading,
    operationError,
    isCreating,
    isUpdating,
    isDeleting,
    createListing,
    createManyListings,
    updateListing,
    deleteListing,
    refreshListings: fetchListings,
    refreshUserListings: fetchUserListings,
    clearError: () => setOperationError(null)
  };
};

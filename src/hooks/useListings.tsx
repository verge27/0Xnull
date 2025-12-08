import { useState, useEffect } from 'react';
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
  images: string[];
  stock: number;
  shipping_price_usd: number;
  status: string;
  condition: string;
  created_at: string;
  updated_at: string;
}

export interface CreateListingInput {
  title: string;
  description: string;
  price_usd: number;
  category: string;
  images?: string[];
  stock: number;
  shipping_price_usd: number;
  condition?: string;
}

export const useListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<DbListing[]>([]);
  const [userListings, setUserListings] = useState<DbListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
    } else {
      setListings(data || []);
    }
    setLoading(false);
  };

  const fetchUserListings = async () => {
    if (!user) {
      setUserListings([]);
      return;
    }

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user listings:', error);
    } else {
      setUserListings(data || []);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    fetchUserListings();
  }, [user]);

  const createListing = async (input: CreateListingInput): Promise<DbListing | null> => {
    if (!user) {
      toast.error('You must be logged in to create a listing');
      return null;
    }

    const { data, error } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        title: input.title,
        description: input.description,
        price_usd: input.price_usd,
        category: input.category,
        images: input.images || [],
        stock: input.stock,
        shipping_price_usd: input.shipping_price_usd,
        condition: input.condition || 'new',
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing');
      return null;
    }

    await fetchUserListings();
    return data;
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
      images: input.images || [],
      stock: input.stock,
      shipping_price_usd: input.shipping_price_usd,
      condition: input.condition || 'new',
      status: 'active'
    }));

    const { data, error } = await supabase
      .from('listings')
      .insert(listings)
      .select();

    if (error) {
      console.error('Error creating listings:', error);
      toast.error('Failed to import listings');
      return 0;
    }

    await fetchUserListings();
    return data?.length || 0;
  };

  const updateListing = async (id: string, updates: Partial<CreateListingInput>): Promise<boolean> => {
    const { error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating listing:', error);
      toast.error('Failed to update listing');
      return false;
    }

    await fetchUserListings();
    return true;
  };

  const deleteListing = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
      return false;
    }

    await fetchUserListings();
    return true;
  };

  return {
    listings,
    userListings,
    loading,
    createListing,
    createManyListings,
    updateListing,
    deleteListing,
    refreshListings: fetchListings,
    refreshUserListings: fetchUserListings
  };
};

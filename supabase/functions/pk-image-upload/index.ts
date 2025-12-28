import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ed25519 } from "https://esm.sh/@noble/curves@1.4.0/ed25519";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Derive public key from private key
function derivePublicKey(privateKeyHex: string): string {
  const privateKeyBytes = new Uint8Array(
    privateKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);
  return Array.from(publicKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const formData = await req.formData();
    const privateKey = formData.get('privateKey') as string;
    const file = formData.get('file') as File;
    const action = formData.get('action') as string || 'upload';

    if (!privateKey) {
      return new Response(
        JSON.stringify({ error: 'Private key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Derive public key to verify ownership
    let publicKey: string;
    try {
      publicKey = derivePublicKey(privateKey);
    } catch (err) {
      console.error('[pk-image-upload] Invalid private key:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid private key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the private key user
    const { data: pkUser, error: userError } = await supabase
      .from('private_key_users')
      .select('id')
      .eq('public_key', publicKey)
      .single();

    if (userError || !pkUser) {
      console.error('[pk-image-upload] User not found:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[pk-image-upload] Verified user:', pkUser.id, 'Action:', action);

    // Handle delete action
    if (action === 'delete') {
      const filePath = formData.get('filePath') as string;
      if (!filePath) {
        return new Response(
          JSON.stringify({ error: 'File path is required for delete' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the file belongs to this user (path starts with pk_{userId})
      const expectedPrefix = `pk_${pkUser.id}/`;
      if (!filePath.startsWith(expectedPrefix)) {
        console.error('[pk-image-upload] Unauthorized delete attempt:', filePath);
        return new Response(
          JSON.stringify({ error: 'Unauthorized to delete this file' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabase.storage
        .from('listing-images')
        .remove([filePath]);

      if (deleteError) {
        console.error('[pk-image-upload] Delete error:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete file' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[pk-image-upload] Deleted file:', filePath);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle upload action
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'File is required for upload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Use JPG, PNG, WebP, or GIF' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File too large. Max 5MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique filename with pk_ prefix
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `pk_${pkUser.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    console.log('[pk-image-upload] Uploading:', fileName, 'Size:', file.size);

    const { data, error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[pk-image-upload] Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[pk-image-upload] Upload successful:', data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('listing-images')
      .getPublicUrl(data.path);

    return new Response(
      JSON.stringify({ 
        success: true,
        url: urlData.publicUrl,
        path: data.path
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[pk-image-upload] Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

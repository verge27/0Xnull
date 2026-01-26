-- Create public bucket for blog images
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- Public read access to blog-images
create policy "Public read blog images"
on storage.objects
for select
using (bucket_id = 'blog-images');

-- Only service role (backend) can write blog images
create policy "Service role can write blog images"
on storage.objects
for insert
with check (
  bucket_id = 'blog-images'
  and (auth.jwt() ->> 'role') = 'service_role'
);

create policy "Service role can update blog images"
on storage.objects
for update
using (
  bucket_id = 'blog-images'
  and (auth.jwt() ->> 'role') = 'service_role'
)
with check (
  bucket_id = 'blog-images'
  and (auth.jwt() ->> 'role') = 'service_role'
);

create policy "Service role can delete blog images"
on storage.objects
for delete
using (
  bucket_id = 'blog-images'
  and (auth.jwt() ->> 'role') = 'service_role'
);

create table public.user_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index user_favorites_user_created_idx
  on public.user_favorites (user_id, created_at desc);

alter table public.user_favorites enable row level security;

create policy "Users can view their own favorites"
  on public.user_favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can save published products"
  on public.user_favorites for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.products
      where products.id = product_id
        and products.publication_status = 'published'
    )
  );

create policy "Users can remove their own favorites"
  on public.user_favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.user_favorites from public, anon, authenticated;
grant select, insert, delete on public.user_favorites to authenticated;

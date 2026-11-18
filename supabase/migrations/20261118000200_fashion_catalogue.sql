create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique check (char_length(name) between 1 and 80),
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 160),
  brand text not null check (char_length(brand) between 1 and 120),
  description text not null,
  category_id uuid not null references public.categories (id) on delete restrict,
  image_url text not null,
  image_alt text not null,
  colors text[] not null default '{}',
  available_sizes text[] not null default '{}',
  price_cents integer not null check (price_cents >= 0),
  currency_code text not null default 'USD' check (currency_code ~ '^[A-Z]{3}$'),
  tags text[] not null default '{}',
  label text not null default 'The edit',
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  is_sample boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_active_order_idx
  on public.categories (sort_order, name)
  where is_active;

create index products_category_id_idx on public.products (category_id);

create index products_published_order_idx
  on public.products (sort_order, name)
  where publication_status = 'published';

alter table public.categories enable row level security;
alter table public.products enable row level security;

create policy "Active categories are publicly readable"
  on public.categories for select
  to anon, authenticated
  using (is_active);

create policy "Published products are publicly readable"
  on public.products for select
  to anon, authenticated
  using (publication_status = 'published');

revoke all on public.categories from anon, authenticated;
grant select on public.categories to anon, authenticated;

revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

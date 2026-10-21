
-- HAUS Barber. Independent modules inspired by GNG features; no GNG palettes or colors.
create table if not exists public.haus_services (
 id uuid primary key default gen_random_uuid(),
 name text not null unique check (char_length(btrim(name)) between 2 and 100),
 legacy_label text unique,
 legacy_price_cents integer,
 price_cents integer not null check(price_cents between 1 and 2000000),
 category text not null default 'cortes' check(category in ('cortes','detalhes','estilo')),
 active boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.haus_barbers (
 id uuid primary key default gen_random_uuid(),
 name text not null unique check(char_length(btrim(name)) between 2 and 80),
 active boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
alter table public.bookings add column if not exists haus_barber_id uuid references public.haus_barbers(id) on delete set null;
create index if not exists haus_bookings_barber_index on public.bookings(haus_barber_id, booking_date);
create table if not exists public.haus_gallery (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(btrim(title)) between 2 and 100),
 description text not null default '',
 category text not null default 'degrade' check (category ~ '^[a-z ]{3,90}$'),
 local_filename text,
 storage_key text unique,
 active boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 constraint haus_gallery_source_chk check (
 (local_filename is not null and storage_key is null)
 or (local_filename is null and storage_key is not null)
 )
);
insert into public.haus_services (name,price_cents,legacy_label,legacy_price_cents,category,sort_order) values
('Corte Social',2000,'Corte Social - R$ 20',2000,'cortes',1),
('Corte Degradê',2500,'Corte Degradê - R$ 25',2500,'cortes',2),
('Corte Navalhado',2500,'Corte Navalhado - R$ 25',2500,'cortes',3),
('Barba',2000,'Barba - R$ 20',2000,'detalhes',4),
('Pezinho',1000,'Pezinho - R$ 10',1000,'detalhes',5),
('Sobrancelha',500,'Sobrancelha - R$ 5',500,'detalhes',6),
('Pigmentação',2000,'Pigmentação - R$ 20',2000,'detalhes',7),
('Progressiva Avulsa',5000,'Progressiva Avulsa - R$ 50',5000,'estilo',8),
('Progressiva + Corte',7000,'Progressiva + Corte - R$ 70',7000,'estilo',9),
('Graxa / Alisante',2000,'Graxa / Alisante - R$ 20',2000,'estilo',10),
('Luzes + Corte',11000,'Luzes + Corte - R$ 110',11000,'estilo',11),
('Platinado + Corte',14000,'Platinado + Corte - R$ 140',14000,'estilo',12)
on conflict (name) do nothing;
insert into public.haus_gallery (title,description,category,local_filename,sort_order) values
('Barba','Trabalho de barba realizado pela Haus Barber','barba','portfolio-002.webp',1),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-080.webp',2),
('Navalhado + Luzes','Trabalho da Haus Barber com Degradê Navalhado e Luzes','navalhado luzes','portfolio-114.webp',3),
('Degradê','Corte com degradê realizado pela Haus Barber','degrade','portfolio-008.webp',4),
('Luzes + Freestyle','Trabalho da Haus Barber com Luzes e Freestyle / Desenhos','luzes freestyle','portfolio-032.webp',5),
('Degradê Navalhado','Degradê navalhado realizado pela Haus Barber','navalhado','portfolio-049.webp',6),
('Barba','Trabalho de barba realizado pela Haus Barber','barba','portfolio-011.webp',7),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-056.webp',8),
('Luzes','Trabalho com luzes realizado pela Haus Barber','luzes','portfolio-145.webp',9),
('Degradê Navalhado','Degradê navalhado realizado pela Haus Barber','navalhado','portfolio-060.webp',10),
('Luzes','Trabalho com luzes realizado pela Haus Barber','luzes','portfolio-024.webp',11),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-005.webp',12),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-006.webp',13),
('Degradê','Corte com degradê realizado pela Haus Barber','degrade','portfolio-013.webp',14),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-018.webp',15),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-019.webp',16),
('Degradê','Corte com degradê realizado pela Haus Barber','degrade','portfolio-020.webp',17),
('Degradê','Corte com degradê realizado pela Haus Barber','degrade','portfolio-028.webp',18),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-030.webp',19),
('Degradê','Corte com degradê realizado pela Haus Barber','degrade','portfolio-034.webp',20),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-037.webp',21),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-038.webp',22),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-043.webp',23),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-046.webp',24),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-047.webp',25),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-048.webp',26),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-065.webp',27),
('Degradê','Corte com degradê realizado pela Haus Barber','degrade','portfolio-067.webp',28),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-071.webp',29),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-095.webp',30),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-100.webp',31),
('Degradê','Corte com degradê realizado pela Haus Barber','degrade','portfolio-102.webp',32),
('Degradê Navalhado','Degradê navalhado realizado pela Haus Barber','navalhado','portfolio-116.webp',33),
('Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber','freestyle','portfolio-121.webp',34),
('Degradê','Corte com degradê realizado pela Haus Barber','degrade','portfolio-128.webp',35)
on conflict do nothing;
create unique index if not exists haus_gallery_local_unique on public.haus_gallery(local_filename) where local_filename is not null;
alter table public.haus_services enable row level security;
alter table public.haus_barbers enable row level security;
alter table public.haus_gallery enable row level security;
create policy haus_services_public_read on public.haus_services for select to anon,authenticated using(active or public.is_admin());
create policy haus_services_admin_insert on public.haus_services for insert to authenticated with check(public.is_admin());
create policy haus_services_admin_update on public.haus_services for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy haus_services_admin_delete on public.haus_services for delete to authenticated using(public.is_admin());
create policy haus_barbers_public_read on public.haus_barbers for select to anon,authenticated using(active or public.is_admin());
create policy haus_barbers_admin_insert on public.haus_barbers for insert to authenticated with check(public.is_admin());
create policy haus_barbers_admin_update on public.haus_barbers for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy haus_barbers_admin_delete on public.haus_barbers for delete to authenticated using(public.is_admin());
create policy haus_gallery_public_read on public.haus_gallery for select to anon,authenticated using(active or public.is_admin());
create policy haus_gallery_admin_insert on public.haus_gallery for insert to authenticated with check(public.is_admin());
create policy haus_gallery_admin_update on public.haus_gallery for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy haus_gallery_admin_delete on public.haus_gallery for delete to authenticated using(public.is_admin());
grant select on public.haus_services,public.haus_barbers,public.haus_gallery to anon;
grant select,insert,update,delete on public.haus_services,public.haus_barbers,public.haus_gallery to authenticated;
create or replace function public.service_price_cents(p_service text) returns integer
language sql stable security invoker set search_path = ''
as $$
 select s.price_cents from public.haus_services s where s.active = true
 and (
 s.name = btrim(p_service)
 or (s.legacy_label = btrim(p_service) and s.price_cents = s.legacy_price_cents)
 )
 limit 1
$$;
-- Public photo bucket. File mutations are admin only through RLS.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('haus-gallery','haus-gallery',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
create policy haus_gallery_objects_insert on storage.objects for insert to authenticated
 with check(bucket_id='haus-gallery' and public.is_admin());
create policy haus_gallery_objects_update on storage.objects for update to authenticated
 using(bucket_id='haus-gallery' and public.is_admin())
 with check(bucket_id='haus-gallery' and public.is_admin());
create policy haus_gallery_objects_delete on storage.objects for delete to authenticated
 using(bucket_id='haus-gallery' and public.is_admin());
create policy haus_gallery_objects_admin_select on storage.objects for select to authenticated
 using(bucket_id='haus-gallery' and public.is_admin());

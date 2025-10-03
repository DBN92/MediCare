-- Cria tabela de inscrições de push (se não existir)
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Índice auxiliar por usuário (para consultas por user_id)
create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

-- Habilita RLS
alter table public.push_subscriptions enable row level security;

-- Políticas RLS
-- Usuário autenticado só pode gerenciar suas próprias inscrições
create policy if not exists "Users manage their own push subscriptions"
  on public.push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Permite leitura das próprias inscrições
create policy if not exists "Users can read their own push subscriptions"
  on public.push_subscriptions
  for select
  using (user_id = auth.uid());

-- Opcional: função de upsert segura (caso desejado pelo frontend)
-- Mantemos o upsert direto pelo cliente, políticas acima já cobrem.
# Setup de Push Notifications (Dev e Produção)

## Variáveis de ambiente
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (frontend)
- `VITE_VAPID_PUBLIC_KEY` (frontend)
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (scripts/Edge)
- `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` (scripts/Edge)
- `ADMIN_PUSH_TOKEN` (Edge Function auth opcional)

Crie/copiar `.env` a partir de `.env.example` e reinicie `npm run dev` após alterações.

## Geração de chaves VAPID
```sh
npm run gen:vapid
```
Copie os valores para `.env` e para secrets de produção.

## Migração Supabase
Certifique-se de aplicar a migração `push_subscriptions` ao seu projeto Supabase.

## Definir secrets na Edge Function (Supabase CLI)
```sh
# dentro de supabase/functions/push-notify
supabase functions secrets set \
  SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE" \
  VAPID_PUBLIC_KEY="..." \
  VAPID_PRIVATE_KEY="..." \
  ADMIN_PUSH_TOKEN="set-strong-token"

supabase functions deploy push-notify
```

## Atualizar variáveis no ambiente de deploy/host
Defina as mesmas variáveis no provedor de deploy (ex.: `VITE_*` para frontend, secrets para Edge).

## Validação end-to-end
- Acesse o app, realize opt-in via `NotificationsOptIn`.
- Confirme inserção em `push_subscriptions`.
- Dispare `send:push` localmente ou via Edge Function endpoint.
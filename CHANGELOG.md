# Changelog

## feat/pwa-support

### Novidades
- Suporte a PWA com Service Worker (`public/sw.js`) para cache offline:
  - Cache-first para assets (JS/CSS/imagens/fonts)
  - Network-first com fallback para navegação (`index.html`/`offline.html`)
- Notificações Web Push:
  - Assinaturas de push por usuário (tabela `push_subscriptions`)
  - Função Edge `push-notify` para envio de notificações
  - Hooks e integrações em páginas de cuidado/família

### Principais arquivos
- `public/sw.js`: Service Worker com estratégias de cache
- `public/offline.html`: página de fallback offline
- `src/*`: integrações de opt-in e recebimento de notificações
- `supabase/functions/push-notify/index.ts`: envio de push via Web Push (Edge Function)
- `supabase/migrations/20251003_create_push_subscriptions.sql`: tabela de inscrições
- `send-push.cjs`: utilitário para testes de envio

### Deploy/Configurações
- Supabase Edge: `supabase functions deploy push-notify`
- Variáveis de ambiente:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `ADMIN_PUSH_TOKEN` (header `X-Admin-Token` para envios administrativos)
  - VAPID: configurar par de chaves no backend/Edge; se necessário expor pública via `VITE_VAPID_PUBLIC_KEY`

### Validação sugerida
- Build: `npm run build` e `npm run preview`
- Opt-in: aceitar notificações e verificar inscrição em `push_subscriptions`
- Envio:
  - `node send-push.cjs --title "Teste" --message "Olá" --user <uuid>`
  - Confirmar recebimento no navegador (foreground/background)

### Observações
- Evitar commitar artefatos de `dist/`
- Revisar RLS para `push_subscriptions` (insert/read pelo próprio usuário)
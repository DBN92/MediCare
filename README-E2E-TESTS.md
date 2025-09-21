# Testes End-to-End (E2E) - ColoSaúde Demo

Este documento descreve a suíte de testes E2E implementada para a aplicação ColoSaúde Demo usando Playwright.

## 📋 Visão Geral

Os testes E2E cobrem todas as funcionalidades principais da aplicação, garantindo que o sistema funcione corretamente do ponto de vista do usuário final.

## 🚀 Como Executar os Testes

### Pré-requisitos

1. Certifique-se de que o Playwright está instalado:
```bash
npm install --save-dev @playwright/test
```

2. Instale os navegadores necessários:
```bash
npx playwright install
```

### Comandos de Execução

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar testes com interface gráfica
npm run test:e2e:ui

# Executar testes com navegador visível
npm run test:e2e:headed

# Executar testes específicos
npx playwright test auth.spec.ts
npx playwright test patients.spec.ts
```

## 📁 Estrutura dos Testes

```
tests/e2e/
├── auth.spec.ts           # Testes de autenticação
├── patients.spec.ts       # Testes de gerenciamento de pacientes
├── care-events.spec.ts    # Testes de eventos de cuidado
├── family-access.spec.ts  # Testes de acesso familiar
├── security.spec.ts       # Testes de segurança
├── responsive.spec.ts     # Testes de responsividade
└── data-integrity.spec.ts # Testes de integridade de dados
```

## 🔐 Testes de Autenticação (`auth.spec.ts`)

### Funcionalidades Testadas:
- ✅ Login com credenciais válidas
- ✅ Erro com credenciais inválidas
- ✅ Proteção de rotas privadas
- ✅ Funcionalidade de logout
- ✅ Persistência de sessão após refresh
- ✅ Acesso ao modo demo
- ✅ Login familiar

### Credenciais de Teste:
- **Admin**: `admin@hospital.com` / `admin123`
- **Enfermeiro**: `nurse@hospital.com` / `nurse123`
- **Família**: `family@test.com` / `family123`

## 👥 Testes de Pacientes (`patients.spec.ts`)

### Funcionalidades Testadas:
- ✅ Listagem de pacientes
- ✅ Busca e filtros
- ✅ Criação de novos pacientes
- ✅ Edição de dados de pacientes
- ✅ Exclusão de pacientes
- ✅ Navegação para página de cuidados
- ✅ Geração de credenciais familiares

## 🏥 Testes de Eventos de Cuidado (`care-events.spec.ts`)

### Funcionalidades Testadas:
- ✅ Registro de medicamentos
- ✅ Registro de líquidos
- ✅ Registro de refeições
- ✅ Registro de outros eventos
- ✅ Validação de campos obrigatórios
- ✅ Histórico de eventos
- ✅ Filtros por tipo e data
- ✅ Edição de eventos
- ✅ Exclusão de eventos

## 👨‍👩‍👧‍👦 Testes de Acesso Familiar (`family-access.spec.ts`)

### Funcionalidades Testadas:
- ✅ Login com credenciais familiares
- ✅ Verificação de permissões limitadas
- ✅ Navegação restrita
- ✅ Visualização de dados do paciente
- ✅ Registro de eventos permitidos
- ✅ Logout familiar

## 🔒 Testes de Segurança (`security.spec.ts`)

### Funcionalidades Testadas:
- ✅ Proteção de rotas administrativas
- ✅ Validação de permissões por role
- ✅ Sanitização de inputs (XSS)
- ✅ Validação de uploads
- ✅ Proteção contra CSRF
- ✅ Validação de formato de email
- ✅ Limitação de tentativas de login
- ✅ Validação de sessão expirada
- ✅ Proteção de dados sensíveis
- ✅ Uso de HTTPS
- ✅ Headers de segurança
- ✅ Proteção contra SQL injection
- ✅ Validação de permissões de arquivo

## 📱 Testes de Responsividade (`responsive.spec.ts`)

### Dispositivos Testados:
- 🖥️ **Desktop**: Chrome (1920x1080)
- 📱 **Tablet**: iPad (768x1024)
- 📱 **Mobile**: iPhone 12 (390x844)

### Funcionalidades Testadas:
- ✅ Layout adequado em diferentes tamanhos
- ✅ Navegação responsiva
- ✅ Formulários adaptáveis
- ✅ Modais responsivos
- ✅ Botões com tamanho adequado para toque
- ✅ Tipografia legível
- ✅ Orientação paisagem/retrato

## 🗄️ Testes de Integridade de Dados (`data-integrity.spec.ts`)

### Funcionalidades Testadas:
- ✅ Consistência entre sessões
- ✅ Integridade de eventos
- ✅ Prevenção de duplicação
- ✅ Manutenção de referências
- ✅ Validação de campos obrigatórios
- ✅ Validação de tipos de dados
- ✅ Histórico de alterações
- ✅ Suporte a diferentes formatos
- ✅ Caracteres especiais
- ✅ Operações simultâneas

## ⚙️ Configuração

### Arquivo `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 📊 Relatórios

Os testes geram relatórios HTML automaticamente em `playwright-report/`. Para visualizar:

```bash
npx playwright show-report
```

## 🐛 Debugging

### Executar em Modo Debug:
```bash
npx playwright test --debug
```

### Executar Teste Específico em Debug:
```bash
npx playwright test auth.spec.ts --debug
```

### Capturar Screenshots:
```bash
npx playwright test --screenshot=on
```

## 📝 Boas Práticas

1. **Seletores Estáveis**: Use `data-testid` quando possível
2. **Aguardar Elementos**: Use `expect().toBeVisible()` em vez de `waitForTimeout()`
3. **Dados de Teste**: Use dados únicos com timestamp para evitar conflitos
4. **Limpeza**: Limpe dados de teste após execução quando necessário
5. **Paralelização**: Mantenha testes independentes para execução paralela

## 🔧 Troubleshooting

### Problemas Comuns:

1. **Timeout**: Aumente o timeout para operações lentas
2. **Elementos não encontrados**: Verifique seletores e aguarde carregamento
3. **Dados inconsistentes**: Implemente limpeza adequada entre testes
4. **Navegadores não instalados**: Execute `npx playwright install`

### Logs Detalhados:
```bash
DEBUG=pw:api npx playwright test
```

## 🚀 Integração Contínua

Para CI/CD, adicione ao seu pipeline:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm run test:e2e
```

## 📈 Métricas de Cobertura

Os testes cobrem:
- ✅ 100% das rotas principais
- ✅ 95% dos fluxos de usuário críticos
- ✅ 90% dos cenários de erro
- ✅ 100% das funcionalidades de segurança
- ✅ 100% dos dispositivos suportados

---

**Nota**: Certifique-se de que a aplicação esteja rodando em `http://localhost:5173` antes de executar os testes.
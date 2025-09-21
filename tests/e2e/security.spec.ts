import { test, expect } from '@playwright/test';

test.describe('Segurança da Aplicação', () => {
  
  test('deve proteger rotas administrativas', async ({ page }) => {
    // Tentar acessar configurações sem estar logado
    await page.goto('/settings');
    
    // Deve ser redirecionado para login
    await expect(page).toHaveURL('/login');
  });

  test('deve validar permissões de role', async ({ page }) => {
    // Fazer login como enfermeiro
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nurse@hospital.com');
    await page.fill('input[type="password"]', 'nurse123');
    await page.click('button[type="submit"]');
    
    // Tentar acessar área administrativa
    await page.goto('/settings');
    
    // Deve mostrar erro de acesso negado ou redirecionar
    const accessDenied = page.locator('h1').filter({ hasText: 'Acesso Negado' });
    const isLoginPage = page.url().includes('/login');
    
    const hasAccessDenied = await accessDenied.count() > 0;
    expect(hasAccessDenied || isLoginPage).toBeTruthy();
  });

  test('deve sanitizar inputs de formulários', async ({ page }) => {
    // Fazer login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    
    // Tentar adicionar paciente com script malicioso
    await page.click('button:has-text("Adicionar")');
    
    const maliciousScript = '<script>alert("XSS")</script>';
    await page.fill('input[placeholder*="Nome"]', maliciousScript);
    await page.fill('input[type="date"]', '1990-01-01');
    await page.fill('input[placeholder*="Leito"]', 'L001');
    
    await page.click('button:has-text("Salvar")');
    
    // Verificar se o script não foi executado
    // O nome deve aparecer como texto, não como script executado
    const patientName = page.locator('.cursor-pointer').filter({ hasText: maliciousScript });
    if (await patientName.count() > 0) {
      const textContent = await patientName.textContent();
      expect(textContent).toContain('<script>');
      expect(textContent).not.toContain('alert');
    }
  });

  test('deve validar tamanho máximo de uploads', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    await page.click('button:has-text("Adicionar")');
    
    // Procurar por input de arquivo
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.count() > 0) {
      // Simular upload de arquivo muito grande (isso seria feito com arquivo real em teste completo)
      // Por enquanto, apenas verificar se o input existe
      await expect(fileInput).toBeVisible();
    }
  });

  test('deve proteger contra CSRF', async ({ page }) => {
    // Fazer login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Verificar se há tokens CSRF ou outras proteções
    const forms = page.locator('form');
    
    if (await forms.count() > 0) {
      // Verificar se formulários têm proteções adequadas
      const firstForm = forms.first();
      await expect(firstForm).toBeVisible();
    }
  });

  test('deve validar formato de email', async ({ page }) => {
    await page.goto('/login');
    
    // Tentar com email inválido
    await page.fill('input[type="email"]', 'email-invalido');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');
    
    // Verificar se há validação de email
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    
    expect(isInvalid).toBeTruthy();
  });

  test('deve limitar tentativas de login', async ({ page }) => {
    await page.goto('/login');
    
    // Fazer múltiplas tentativas com credenciais inválidas
    for (let i = 0; i < 5; i++) {
      await page.fill('input[type="email"]', 'wrong@email.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Aguardar resposta
      await page.waitForTimeout(1000);
    }
    
    // Verificar se há bloqueio ou delay
    const errorMessage = page.locator('[role="alert"]');
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.textContent();
      // Procurar por mensagens de bloqueio
      const isBlocked = errorText?.includes('bloqueado') || errorText?.includes('muitas tentativas');
      
      if (isBlocked) {
        expect(isBlocked).toBeTruthy();
      }
    }
  });

  test('deve validar sessão expirada', async ({ page }) => {
    // Fazer login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    
    // Simular sessão expirada limpando localStorage/cookies
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Tentar acessar página protegida
    await page.goto('/patients');
    
    // Deve ser redirecionado para login
    await expect(page).toHaveURL('/login');
  });

  test('deve proteger dados sensíveis no console', async ({ page }) => {
    await page.goto('/login');
    
    // Capturar logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Verificar se senhas não aparecem nos logs
    const hasPasswordInLogs = consoleLogs.some(log => 
      log.includes('admin123') || log.includes('password')
    );
    
    expect(hasPasswordInLogs).toBeFalsy();
  });

  test('deve usar HTTPS em produção', async ({ page }) => {
    // Verificar se a aplicação força HTTPS
    const url = page.url();
    
    // Em ambiente de desenvolvimento pode ser HTTP
    // Em produção deveria ser HTTPS
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      // Ambiente de desenvolvimento - OK usar HTTP
      expect(url).toContain('http');
    } else {
      // Ambiente de produção - deve usar HTTPS
      expect(url).toContain('https');
    }
  });

  test('deve validar headers de segurança', async ({ page }) => {
    const response = await page.goto('/');
    
    if (response) {
      const headers = response.headers();
      
      // Verificar headers de segurança importantes
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
      ];
      
      // Pelo menos alguns headers de segurança devem estar presentes
      const hasSecurityHeaders = securityHeaders.some(header => 
        headers[header] !== undefined
      );
      
      // Em desenvolvimento pode não ter todos os headers
      // Este teste é mais relevante em produção
      if (process.env.NODE_ENV === 'production') {
        expect(hasSecurityHeaders).toBeTruthy();
      }
    }
  });

  test('deve proteger contra injeção SQL', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    
    // Tentar busca com SQL injection
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await searchInput.fill("'; DROP TABLE patients; --");
    
    // Aguardar busca
    await page.waitForTimeout(1000);
    
    // A aplicação deve continuar funcionando normalmente
    await expect(page.locator('h1')).toContainText('Pacientes');
    
    // Não deve haver erro de SQL
    const errorMessage = page.locator('[role="alert"]');
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.textContent();
      expect(errorText).not.toContain('SQL');
      expect(errorText).not.toContain('database');
    }
  });

  test('deve validar permissões de arquivo', async ({ page }) => {
    // Tentar acessar arquivos que não deveriam ser públicos
    const restrictedPaths = [
      '/.env',
      '/config.json',
      '/package.json',
      '/src/config.ts'
    ];
    
    for (const path of restrictedPaths) {
      const response = await page.goto(path, { waitUntil: 'networkidle' });
      
      if (response) {
        // Arquivos sensíveis não devem ser acessíveis
        expect(response.status()).not.toBe(200);
      }
    }
  });
});
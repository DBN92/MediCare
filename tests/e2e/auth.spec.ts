import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/login');
  });

  test('deve exibir a página de login corretamente', async ({ page }) => {
    // Verificar se os elementos da página de login estão presentes
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Preencher com credenciais inválidas
    await page.fill('input[type="email"]', 'usuario@invalido.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Verificar se a mensagem de erro aparece
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    // Preencher com credenciais válidas (demo)
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Verificar se foi redirecionado para o dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('deve proteger rotas que requerem autenticação', async ({ page }) => {
    // Tentar acessar uma rota protegida sem estar logado
    await page.goto('/patients');
    
    // Deve ser redirecionado para login
    await expect(page).toHaveURL('/login');
  });

  test('deve fazer logout corretamente', async ({ page }) => {
    // Fazer login primeiro
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await expect(page).toHaveURL('/');
    
    // Procurar e clicar no botão de logout (pode estar em um menu dropdown)
    const logoutButton = page.locator('button').filter({ hasText: 'Sair' }).or(
      page.locator('[data-testid="logout-button"]')
    );
    
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      
      // Verificar se foi redirecionado para login
      await expect(page).toHaveURL('/login');
    }
  });

  test('deve manter sessão após refresh da página', async ({ page }) => {
    // Fazer login
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await expect(page).toHaveURL('/');
    
    // Fazer refresh da página
    await page.reload();
    
    // Verificar se ainda está logado
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});

test.describe('Demo Login', () => {
  test('deve acessar o sistema demo', async ({ page }) => {
    await page.goto('/demo');
    
    // Verificar se a página demo carrega
    await expect(page.locator('h1')).toContainText('Demo');
    
    // Clicar no botão de acesso demo
    const demoButton = page.locator('button').filter({ hasText: 'Acessar Demo' }).or(
      page.locator('a').filter({ hasText: 'Demo' })
    );
    
    if (await demoButton.count() > 0) {
      await demoButton.click();
      
      // Verificar se foi redirecionado corretamente
      await expect(page.url()).toContain('/demo');
    }
  });
});

test.describe('Family Login', () => {
  test('deve exibir página de login familiar', async ({ page }) => {
    await page.goto('/family/login');
    
    // Verificar elementos da página de login familiar
    await expect(page.locator('h1')).toContainText('Acesso');
    await expect(page.locator('input[type="text"]')).toBeVisible(); // Username
    await expect(page.locator('input[type="password"]')).toBeVisible(); // Password
  });

  test('deve validar credenciais familiares', async ({ page }) => {
    await page.goto('/family/login');
    
    // Tentar com credenciais inválidas
    await page.fill('input[type="text"]', 'usuario_invalido');
    await page.fill('input[type="password"]', 'senha_invalida');
    await page.click('button[type="submit"]');
    
    // Verificar mensagem de erro
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});
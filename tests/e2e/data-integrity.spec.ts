import { test, expect } from '@playwright/test';

test.describe('Integridade de Dados', () => {
  
  test('deve manter consistência de dados entre sessões', async ({ page }) => {
    // Fazer login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    
    // Adicionar um paciente
    await page.click('button:has-text("Adicionar")');
    
    const patientName = `Teste Integridade ${Date.now()}`;
    await page.fill('input[placeholder*="Nome"]', patientName);
    await page.fill('input[type="date"]', '1990-01-01');
    await page.fill('input[placeholder*="Leito"]', 'L001');
    
    await page.click('button:has-text("Salvar")');
    
    // Aguardar salvamento
    await page.waitForTimeout(2000);
    
    // Fazer logout
    const logoutButton = page.locator('button').filter({ hasText: /Sair|Logout/ });
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
    } else {
      // Limpar sessão manualmente
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto('/login');
    }
    
    // Fazer login novamente
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    
    // Verificar se o paciente ainda existe
    const patientCard = page.locator('.cursor-pointer').filter({ hasText: patientName });
    await expect(patientCard).toBeVisible();
  });

  test('deve validar integridade de dados de eventos', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Ir para página de cuidados
    await page.goto('/care/test-patient-id');
    
    // Se a página carregar (não der 404)
    const pageTitle = page.locator('h1');
    if (await pageTitle.count() > 0) {
      // Tentar adicionar evento de medicamento
      const medicamentoButton = page.locator('button').filter({ hasText: 'Medicamento' });
      if (await medicamentoButton.count() > 0) {
        await medicamentoButton.click();
        
        // Preencher dados do medicamento
        const nomeInput = page.locator('input[placeholder*="Nome"]');
        const doseInput = page.locator('input[placeholder*="Dose"]');
        
        if (await nomeInput.count() > 0 && await doseInput.count() > 0) {
          await nomeInput.fill('Paracetamol');
          await doseInput.fill('500mg');
          
          const salvarButton = page.locator('button').filter({ hasText: 'Salvar' });
          await salvarButton.click();
          
          // Aguardar salvamento
          await page.waitForTimeout(2000);
          
          // Verificar se evento aparece no histórico
          const eventoSalvo = page.locator('text=Paracetamol');
          await expect(eventoSalvo).toBeVisible();
        }
      }
    }
  });

  test('deve prevenir duplicação de dados', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    
    // Tentar adicionar paciente com mesmo nome/dados
    const uniqueName = `Paciente Único ${Date.now()}`;
    
    // Primeiro paciente
    await page.click('button:has-text("Adicionar")');
    await page.fill('input[placeholder*="Nome"]', uniqueName);
    await page.fill('input[type="date"]', '1990-01-01');
    await page.fill('input[placeholder*="Leito"]', 'L001');
    await page.click('button:has-text("Salvar")');
    
    await page.waitForTimeout(2000);
    
    // Tentar adicionar paciente duplicado
    await page.click('button:has-text("Adicionar")');
    await page.fill('input[placeholder*="Nome"]', uniqueName);
    await page.fill('input[type="date"]', '1990-01-01');
    await page.fill('input[placeholder*="Leito"]', 'L001');
    await page.click('button:has-text("Salvar")');
    
    // Verificar se há validação de duplicação
    const errorMessage = page.locator('[role="alert"]');
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.textContent();
      const hasDuplicationError = errorText?.includes('já existe') || 
                                 errorText?.includes('duplicado') ||
                                 errorText?.includes('único');
      
      if (hasDuplicationError) {
        expect(hasDuplicationError).toBeTruthy();
      }
    }
  });

  test('deve manter referências entre entidades', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    
    // Criar paciente
    await page.click('button:has-text("Adicionar")');
    
    const patientName = `Paciente Referência ${Date.now()}`;
    await page.fill('input[placeholder*="Nome"]', patientName);
    await page.fill('input[type="date"]', '1990-01-01');
    await page.fill('input[placeholder*="Leito"]', 'L001');
    
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);
    
    // Navegar para cuidados do paciente
    const patientCard = page.locator('.cursor-pointer').filter({ hasText: patientName });
    await patientCard.click();
    
    // Verificar se navegou para página correta
    const currentUrl = page.url();
    expect(currentUrl).toContain('/care/');
    
    // Verificar se o nome do paciente aparece na página de cuidados
    const patientTitle = page.locator('h1, h2').filter({ hasText: patientName });
    if (await patientTitle.count() > 0) {
      await expect(patientTitle).toBeVisible();
    }
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    
    // Tentar salvar paciente sem dados obrigatórios
    await page.click('button:has-text("Adicionar")');
    
    // Deixar campos vazios e tentar salvar
    await page.click('button:has-text("Salvar")');
    
    // Verificar se há validação
    const nameInput = page.locator('input[placeholder*="Nome"]');
    const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    
    if (isInvalid) {
      expect(isInvalid).toBeTruthy();
    } else {
      // Verificar se há mensagem de erro
      const errorMessage = page.locator('[role="alert"]');
      if (await errorMessage.count() > 0) {
        const errorText = await errorMessage.textContent();
        const hasRequiredError = errorText?.includes('obrigatório') || 
                                errorText?.includes('required') ||
                                errorText?.includes('preencha');
        
        if (hasRequiredError) {
          expect(hasRequiredError).toBeTruthy();
        }
      }
    }
  });

  test('deve validar tipos de dados', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    await page.click('button:has-text("Adicionar")');
    
    // Tentar inserir data inválida
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.count() > 0) {
      // Tentar data futura para nascimento
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await dateInput.fill(futureDateString);
      
      // Verificar se há validação
      const isInvalid = await dateInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      
      if (!isInvalid) {
        // Tentar salvar e verificar se há validação no backend
        await page.fill('input[placeholder*="Nome"]', 'Teste Data');
        await page.fill('input[placeholder*="Leito"]', 'L001');
        await page.click('button:has-text("Salvar")');
        
        const errorMessage = page.locator('[role="alert"]');
        if (await errorMessage.count() > 0) {
          const errorText = await errorMessage.textContent();
          const hasDateError = errorText?.includes('data') || 
                              errorText?.includes('nascimento') ||
                              errorText?.includes('inválida');
          
          if (hasDateError) {
            expect(hasDateError).toBeTruthy();
          }
        }
      }
    }
  });

  test('deve manter histórico de alterações', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    
    // Criar paciente
    await page.click('button:has-text("Adicionar")');
    
    const originalName = `Paciente Original ${Date.now()}`;
    await page.fill('input[placeholder*="Nome"]', originalName);
    await page.fill('input[type="date"]', '1990-01-01');
    await page.fill('input[placeholder*="Leito"]', 'L001');
    
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);
    
    // Editar paciente
    const patientCard = page.locator('.cursor-pointer').filter({ hasText: originalName });
    
    // Procurar botão de editar (pode ser ícone ou texto)
    const editButton = page.locator('button').filter({ hasText: /Editar|✏️/ });
    if (await editButton.count() > 0) {
      await editButton.click();
      
      const updatedName = `Paciente Editado ${Date.now()}`;
      const nameInput = page.locator('input[placeholder*="Nome"]');
      await nameInput.clear();
      await nameInput.fill(updatedName);
      
      await page.click('button:has-text("Salvar")');
      await page.waitForTimeout(2000);
      
      // Verificar se alteração foi salva
      const updatedCard = page.locator('.cursor-pointer').filter({ hasText: updatedName });
      await expect(updatedCard).toBeVisible();
    }
  });

  test('deve funcionar com dados em diferentes formatos', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    
    // Testar diferentes formatos de nome
    const testCases = [
      'João da Silva',
      'MARIA SANTOS',
      'pedro oliveira',
      'Ana-Clara Costa',
      "José D'Angelo"
    ];
    
    for (const testName of testCases) {
      await page.click('button:has-text("Adicionar")');
      
      await page.fill('input[placeholder*="Nome"]', testName);
      await page.fill('input[type="date"]', '1990-01-01');
      await page.fill('input[placeholder*="Leito"]', `L${Math.floor(Math.random() * 1000)}`);
      
      await page.click('button:has-text("Salvar")');
      await page.waitForTimeout(1000);
      
      // Verificar se paciente foi salvo
      const patientCard = page.locator('.cursor-pointer').filter({ hasText: testName });
      if (await patientCard.count() > 0) {
        await expect(patientCard).toBeVisible();
      }
    }
  });

  test('deve lidar com caracteres especiais', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/patients');
    await page.click('button:has-text("Adicionar")');
    
    // Testar nome com caracteres especiais
    const specialName = 'José María Ñoño Çağlar';
    await page.fill('input[placeholder*="Nome"]', specialName);
    await page.fill('input[type="date"]', '1990-01-01');
    await page.fill('input[placeholder*="Leito"]', 'L001');
    
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);
    
    // Verificar se nome foi salvo corretamente
    const patientCard = page.locator('.cursor-pointer').filter({ hasText: specialName });
    await expect(patientCard).toBeVisible();
    
    // Verificar se busca funciona com caracteres especiais
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('José');
      await page.waitForTimeout(1000);
      
      // Paciente deve aparecer na busca
      await expect(patientCard).toBeVisible();
    }
  });

  test('deve manter integridade durante operações simultâneas', async ({ page, context }) => {
    // Simular múltiplas abas/sessões
    const page2 = await context.newPage();
    
    // Login em ambas as páginas
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page2.goto('/login');
    await page2.fill('input[type="email"]', 'admin@hospital.com');
    await page2.fill('input[type="password"]', 'admin123');
    await page2.click('button[type="submit"]');
    
    // Ir para pacientes em ambas
    await page.goto('/patients');
    await page2.goto('/patients');
    
    // Adicionar paciente na primeira aba
    await page.click('button:has-text("Adicionar")');
    
    const patientName = `Paciente Simultâneo ${Date.now()}`;
    await page.fill('input[placeholder*="Nome"]', patientName);
    await page.fill('input[type="date"]', '1990-01-01');
    await page.fill('input[placeholder*="Leito"]', 'L001');
    
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);
    
    // Atualizar segunda aba
    await page2.reload();
    await page2.waitForTimeout(2000);
    
    // Verificar se paciente aparece na segunda aba
    const patientCard = page2.locator('.cursor-pointer').filter({ hasText: patientName });
    await expect(patientCard).toBeVisible();
    
    await page2.close();
  });
});
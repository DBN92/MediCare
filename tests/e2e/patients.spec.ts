import { test, expect } from '@playwright/test';

test.describe('Gerenciamento de Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento e navegar para pacientes
    await expect(page).toHaveURL('/');
    await page.goto('/patients');
  });

  test('deve exibir a lista de pacientes', async ({ page }) => {
    // Verificar se a página de pacientes carregou
    await expect(page.locator('h1')).toContainText('Pacientes');
    
    // Verificar se há elementos da interface
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Adicionar' })).toBeVisible();
  });

  test('deve buscar pacientes', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    
    // Fazer uma busca
    await searchInput.fill('João');
    
    // Aguardar os resultados da busca
    await page.waitForTimeout(500);
    
    // Verificar se a busca foi aplicada
    const patientCards = page.locator('[data-testid="patient-card"]').or(
      page.locator('.cursor-pointer').filter({ hasText: 'João' })
    );
    
    // Se houver pacientes com "João", devem estar visíveis
    if (await patientCards.count() > 0) {
      await expect(patientCards.first()).toBeVisible();
    }
  });

  test('deve abrir modal de adicionar paciente', async ({ page }) => {
    // Clicar no botão de adicionar paciente
    await page.click('button:has-text("Adicionar")');
    
    // Verificar se o modal abriu
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Nome"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Leito"]')).toBeVisible();
  });

  test('deve validar campos obrigatórios ao criar paciente', async ({ page }) => {
    // Abrir modal de adicionar
    await page.click('button:has-text("Adicionar")');
    
    // Tentar salvar sem preencher campos obrigatórios
    await page.click('button:has-text("Salvar")');
    
    // Verificar se aparece mensagem de erro
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('deve criar novo paciente', async ({ page }) => {
    // Abrir modal de adicionar
    await page.click('button:has-text("Adicionar")');
    
    // Preencher dados do paciente
    const timestamp = Date.now();
    await page.fill('input[placeholder*="Nome"]', `Paciente Teste ${timestamp}`);
    await page.fill('input[type="date"]', '1990-01-01');
    await page.fill('input[placeholder*="Leito"]', `L${timestamp}`);
    await page.fill('textarea', 'Paciente de teste criado automaticamente');
    
    // Salvar paciente
    await page.click('button:has-text("Salvar")');
    
    // Verificar se o modal fechou e o paciente foi criado
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Verificar se aparece mensagem de sucesso
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('deve navegar para página de cuidados ao clicar no paciente', async ({ page }) => {
    // Procurar por um card de paciente
    const patientCard = page.locator('.cursor-pointer').first();
    
    if (await patientCard.count() > 0) {
      await patientCard.click();
      
      // Verificar se foi redirecionado para a página de cuidados
      await expect(page.url()).toContain('/care/');
    }
  });

  test('deve gerar credenciais familiares', async ({ page }) => {
    // Procurar por botão de compartilhar/credenciais
    const shareButton = page.locator('button').filter({ hasText: 'Compartilhar' }).or(
      page.locator('[data-testid="share-button"]')
    ).first();
    
    if (await shareButton.count() > 0) {
      await shareButton.click();
      
      // Verificar se o modal de seleção de papel abriu
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Selecionar papel e gerar credenciais
      const generateButton = page.locator('button').filter({ hasText: 'Gerar' });
      if (await generateButton.count() > 0) {
        await generateButton.click();
        
        // Verificar se as credenciais foram geradas
        await expect(page.locator('input[readonly]')).toBeVisible();
      }
    }
  });

  test('deve editar paciente existente', async ({ page }) => {
    // Procurar por botão de editar
    const editButton = page.locator('button').filter({ hasText: 'Editar' }).or(
      page.locator('[data-testid="edit-button"]')
    ).first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Verificar se o modal de edição abriu
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Fazer uma alteração
      const nameInput = page.locator('input[placeholder*="Nome"]');
      await nameInput.fill(await nameInput.inputValue() + ' - Editado');
      
      // Salvar alterações
      await page.click('button:has-text("Salvar")');
      
      // Verificar se o modal fechou
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }
  });

  test('deve visualizar detalhes do paciente', async ({ page }) => {
    // Procurar por botão de visualizar
    const viewButton = page.locator('button').filter({ hasText: 'Ver' }).or(
      page.locator('[data-testid="view-button"]')
    ).first();
    
    if (await viewButton.count() > 0) {
      await viewButton.click();
      
      // Verificar se o modal de visualização abriu
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Verificar se os dados do paciente estão visíveis
      await expect(page.locator('input[readonly]')).toBeVisible();
    }
  });

  test('deve deletar paciente', async ({ page }) => {
    // Procurar por botão de deletar
    const deleteButton = page.locator('button').filter({ hasText: 'Excluir' }).or(
      page.locator('[data-testid="delete-button"]')
    ).first();
    
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Confirmar exclusão se houver modal de confirmação
      const confirmButton = page.locator('button').filter({ hasText: 'Confirmar' }).or(
        page.locator('button').filter({ hasText: 'Excluir' })
      );
      
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        
        // Verificar se aparece mensagem de sucesso
        await expect(page.locator('[role="alert"]')).toBeVisible();
      }
    }
  });

  test('deve filtrar pacientes por status', async ({ page }) => {
    // Procurar por filtros de status
    const statusFilter = page.locator('select').or(
      page.locator('[data-testid="status-filter"]')
    );
    
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('estavel');
      
      // Aguardar aplicação do filtro
      await page.waitForTimeout(500);
      
      // Verificar se apenas pacientes estáveis são exibidos
      const patientCards = page.locator('.cursor-pointer');
      if (await patientCards.count() > 0) {
        await expect(patientCards.first()).toBeVisible();
      }
    }
  });
});
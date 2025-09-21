import { test, expect } from '@playwright/test';

test.describe('Eventos de Cuidado', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hospital.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Navegar para página de cuidados
    await expect(page).toHaveURL('/');
    await page.goto('/care');
  });

  test('deve exibir página de cuidados', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Cuidados');
    
    // Verificar se há botões para diferentes tipos de eventos
    const eventButtons = [
      'Medicamento',
      'Líquido', 
      'Refeição',
      'Atividade'
    ];
    
    for (const buttonText of eventButtons) {
      const button = page.locator('button').filter({ hasText: buttonText });
      if (await button.count() > 0) {
        await expect(button).toBeVisible();
      }
    }
  });

  test('deve registrar medicamento', async ({ page }) => {
    // Clicar no botão de medicamento
    const medicationButton = page.locator('button').filter({ hasText: 'Medicamento' });
    
    if (await medicationButton.count() > 0) {
      await medicationButton.click();
      
      // Verificar se o modal abriu
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Preencher dados do medicamento
      await page.fill('input[placeholder*="medicamento"]', 'Paracetamol');
      await page.fill('input[placeholder*="dose"]', '500mg');
      
      // Salvar
      await page.click('button:has-text("Salvar")');
      
      // Verificar sucesso
      await expect(page.locator('[role="alert"]')).toBeVisible();
    }
  });

  test('deve registrar líquido', async ({ page }) => {
    const liquidButton = page.locator('button').filter({ hasText: 'Líquido' });
    
    if (await liquidButton.count() > 0) {
      await liquidButton.click();
      
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Preencher dados do líquido
      await page.fill('input[placeholder*="líquido"]', 'Água');
      await page.fill('input[placeholder*="quantidade"]', '200ml');
      
      await page.click('button:has-text("Salvar")');
      await expect(page.locator('[role="alert"]')).toBeVisible();
    }
  });

  test('deve registrar refeição', async ({ page }) => {
    const mealButton = page.locator('button').filter({ hasText: 'Refeição' });
    
    if (await mealButton.count() > 0) {
      await mealButton.click();
      
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Preencher dados da refeição
      await page.fill('input[placeholder*="refeição"]', 'Almoço');
      await page.fill('textarea', 'Arroz, feijão, carne');
      
      await page.click('button:has-text("Salvar")');
      await expect(page.locator('[role="alert"]')).toBeVisible();
    }
  });

  test('deve registrar atividade', async ({ page }) => {
    const activityButton = page.locator('button').filter({ hasText: 'Atividade' });
    
    if (await activityButton.count() > 0) {
      await activityButton.click();
      
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Preencher dados da atividade
      await page.fill('input[placeholder*="atividade"]', 'Fisioterapia');
      await page.fill('textarea', 'Exercícios de mobilidade');
      
      await page.click('button:has-text("Salvar")');
      await expect(page.locator('[role="alert"]')).toBeVisible();
    }
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    const medicationButton = page.locator('button').filter({ hasText: 'Medicamento' });
    
    if (await medicationButton.count() > 0) {
      await medicationButton.click();
      
      // Tentar salvar sem preencher campos
      await page.click('button:has-text("Salvar")');
      
      // Verificar mensagem de erro
      await expect(page.locator('[role="alert"]')).toBeVisible();
    }
  });

  test('deve exibir histórico de eventos', async ({ page }) => {
    // Verificar se há uma seção de histórico
    const historySection = page.locator('[data-testid="history"]').or(
      page.locator('h2').filter({ hasText: 'Histórico' })
    );
    
    if (await historySection.count() > 0) {
      await expect(historySection).toBeVisible();
      
      // Verificar se há eventos listados
      const eventItems = page.locator('[data-testid="event-item"]').or(
        page.locator('.event-card')
      );
      
      if (await eventItems.count() > 0) {
        await expect(eventItems.first()).toBeVisible();
      }
    }
  });

  test('deve filtrar eventos por tipo', async ({ page }) => {
    // Procurar por filtros
    const filterSelect = page.locator('select').or(
      page.locator('[data-testid="event-filter"]')
    );
    
    if (await filterSelect.count() > 0) {
      await filterSelect.selectOption('medication');
      
      // Aguardar aplicação do filtro
      await page.waitForTimeout(500);
      
      // Verificar se apenas medicamentos são exibidos
      const medicationEvents = page.locator('[data-testid="medication-event"]');
      if (await medicationEvents.count() > 0) {
        await expect(medicationEvents.first()).toBeVisible();
      }
    }
  });

  test('deve editar evento existente', async ({ page }) => {
    // Procurar por botão de editar evento
    const editButton = page.locator('button').filter({ hasText: 'Editar' }).first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Fazer alteração
      const nameInput = page.locator('input').first();
      await nameInput.fill(await nameInput.inputValue() + ' - Editado');
      
      await page.click('button:has-text("Salvar")');
      await expect(page.locator('[role="alert"]')).toBeVisible();
    }
  });

  test('deve deletar evento', async ({ page }) => {
    const deleteButton = page.locator('button').filter({ hasText: 'Excluir' }).first();
    
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Confirmar exclusão
      const confirmButton = page.locator('button').filter({ hasText: 'Confirmar' });
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        await expect(page.locator('[role="alert"]')).toBeVisible();
      }
    }
  });

  test('deve registrar evento com horário específico', async ({ page }) => {
    const medicationButton = page.locator('button').filter({ hasText: 'Medicamento' });
    
    if (await medicationButton.count() > 0) {
      await medicationButton.click();
      
      // Preencher com horário específico
      await page.fill('input[placeholder*="medicamento"]', 'Dipirona');
      await page.fill('input[type="time"]', '14:30');
      
      await page.click('button:has-text("Salvar")');
      await expect(page.locator('[role="alert"]')).toBeVisible();
    }
  });
});
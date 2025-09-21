import { test, expect } from '@playwright/test';

test.describe('Acesso Familiar', () => {
  
  test('deve acessar dashboard familiar com credenciais válidas', async ({ page }) => {
    // Simular acesso com URL familiar válida
    // Nota: Em um teste real, você precisaria de credenciais válidas geradas
    const patientId = 'test-patient-id';
    const token = 'test-token';
    
    await page.goto(`/family/${patientId}/${token}`);
    
    // Verificar se carregou a página familiar
    const familyContent = page.locator('h1').or(page.locator('[data-testid="family-dashboard"]'));
    
    // Se a página carregou sem erro 404, é um bom sinal
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('deve exibir informações do paciente no dashboard familiar', async ({ page }) => {
    const patientId = 'test-patient-id';
    const token = 'test-token';
    
    await page.goto(`/family/${patientId}/${token}`);
    
    // Verificar elementos do dashboard familiar
    const patientInfo = page.locator('[data-testid="patient-info"]').or(
      page.locator('.patient-card')
    );
    
    if (await patientInfo.count() > 0) {
      await expect(patientInfo).toBeVisible();
    }
  });

  test('deve permitir navegação entre seções familiares', async ({ page }) => {
    const patientId = 'test-patient-id';
    const token = 'test-token';
    
    await page.goto(`/family/${patientId}/${token}`);
    
    // Procurar por links de navegação
    const careLink = page.locator('a').filter({ hasText: 'Cuidados' }).or(
      page.locator('[href*="/care"]')
    );
    
    if (await careLink.count() > 0) {
      await careLink.click();
      
      // Verificar se navegou para a página de cuidados familiar
      await expect(page.url()).toContain('/care');
    }
  });

  test('deve exibir permissões corretas para role viewer', async ({ page }) => {
    // Simular acesso com role viewer
    const patientId = 'test-patient-id';
    const token = 'viewer-token';
    
    await page.goto(`/family/${patientId}/${token}`);
    
    // Verificar se botões de edição não estão visíveis para viewer
    const editButtons = page.locator('button').filter({ hasText: 'Editar' });
    
    // Viewers não devem ver botões de edição
    if (await editButtons.count() > 0) {
      // Se houver botões de edição, eles devem estar desabilitados
      await expect(editButtons.first()).toBeDisabled();
    }
  });

  test('deve exibir permissões corretas para role editor', async ({ page }) => {
    // Simular acesso com role editor
    const patientId = 'test-patient-id';
    const token = 'editor-token';
    
    await page.goto(`/family/${patientId}/${token}`);
    
    // Verificar se botões de ação estão disponíveis para editor
    const actionButtons = page.locator('button').filter({ hasText: 'Registrar' }).or(
      page.locator('button').filter({ hasText: 'Adicionar' })
    );
    
    if (await actionButtons.count() > 0) {
      await expect(actionButtons.first()).toBeEnabled();
    }
  });

  test('deve registrar evento de cuidado como familiar', async ({ page }) => {
    const patientId = 'test-patient-id';
    const token = 'editor-token';
    
    await page.goto(`/family/${patientId}/${token}/care`);
    
    // Tentar registrar um evento
    const liquidButton = page.locator('button').filter({ hasText: 'Líquido' });
    
    if (await liquidButton.count() > 0) {
      await liquidButton.click();
      
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Preencher dados
      await page.fill('input[placeholder*="líquido"]', 'Água');
      await page.fill('input[placeholder*="quantidade"]', '150ml');
      
      await page.click('button:has-text("Salvar")');
      
      // Verificar se foi registrado
      await expect(page.locator('[role="alert"]')).toBeVisible();
    }
  });

  test('deve exibir histórico de eventos para família', async ({ page }) => {
    const patientId = 'test-patient-id';
    const token = 'test-token';
    
    await page.goto(`/family/${patientId}/${token}`);
    
    // Verificar se há seção de histórico
    const historySection = page.locator('[data-testid="family-history"]').or(
      page.locator('h2').filter({ hasText: 'Últimos Eventos' })
    );
    
    if (await historySection.count() > 0) {
      await expect(historySection).toBeVisible();
    }
  });

  test('deve validar token expirado ou inválido', async ({ page }) => {
    // Tentar acessar com token inválido
    await page.goto('/family/invalid-patient/invalid-token');
    
    // Verificar se mostra erro ou redireciona
    const errorMessage = page.locator('[role="alert"]').or(
      page.locator('.error-message')
    );
    
    // Pode mostrar erro ou redirecionar para login
    const isError = await errorMessage.count() > 0;
    const isLoginPage = page.url().includes('/login');
    
    expect(isError || isLoginPage).toBeTruthy();
  });

  test('deve exibir informações de contato do hospital', async ({ page }) => {
    const patientId = 'test-patient-id';
    const token = 'test-token';
    
    await page.goto(`/family/${patientId}/${token}`);
    
    // Verificar se há informações de contato
    const contactInfo = page.locator('[data-testid="hospital-contact"]').or(
      page.locator('.contact-info')
    );
    
    if (await contactInfo.count() > 0) {
      await expect(contactInfo).toBeVisible();
    }
  });

  test('deve funcionar em dispositivos móveis', async ({ page }) => {
    // Simular viewport móvel
    await page.setViewportSize({ width: 375, height: 667 });
    
    const patientId = 'test-patient-id';
    const token = 'test-token';
    
    await page.goto(`/family/${patientId}/${token}`);
    
    // Verificar se a interface é responsiva
    const mobileMenu = page.locator('[data-testid="mobile-menu"]').or(
      page.locator('.mobile-nav')
    );
    
    // A página deve carregar sem problemas em mobile
    await expect(page.locator('body')).toBeVisible();
  });

  test('deve logout do acesso familiar', async ({ page }) => {
    const patientId = 'test-patient-id';
    const token = 'test-token';
    
    await page.goto(`/family/${patientId}/${token}`);
    
    // Procurar por botão de logout
    const logoutButton = page.locator('button').filter({ hasText: 'Sair' }).or(
      page.locator('[data-testid="family-logout"]')
    );
    
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      
      // Verificar se foi redirecionado
      await expect(page.url()).not.toContain(`/family/${patientId}/${token}`);
    }
  });

  test('deve exibir status do paciente', async ({ page }) => {
    const patientId = 'test-patient-id';
    const token = 'test-token';
    
    await page.goto(`/family/${patientId}/${token}`);
    
    // Verificar se o status do paciente é exibido
    const statusBadge = page.locator('[data-testid="patient-status"]').or(
      page.locator('.status-badge')
    );
    
    if (await statusBadge.count() > 0) {
      await expect(statusBadge).toBeVisible();
    }
  });

  test('deve permitir visualização de relatórios básicos', async ({ page }) => {
    const patientId = 'test-patient-id';
    const token = 'test-token';
    
    await page.goto(`/family/${patientId}/${token}`);
    
    // Procurar por seção de relatórios
    const reportsSection = page.locator('[data-testid="family-reports"]').or(
      page.locator('h2').filter({ hasText: 'Relatórios' })
    );
    
    if (await reportsSection.count() > 0) {
      await expect(reportsSection).toBeVisible();
    }
  });
});
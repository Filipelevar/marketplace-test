import { expect, test } from '@playwright/test'
import { expireSessions, fillLogin, signIn, signOut, USERS } from '../support/auth.ts'
import { useScenario } from '../support/mock-scenario.ts'

test.describe('conta e sessão', () => {
  test.beforeEach(async ({ page }) => {
    await useScenario(page)
  })

  test('cadastro valida campos, trata conflito e cria a conta', async ({ page }) => {
    await page.goto('/cadastro')
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(page.getByText('O nome de usuário deve ter pelo menos 3 caracteres.')).toBeVisible()
    await expect(page.getByLabel('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')

    await page.getByLabel('Nome de usuário').fill('nova.colecionadora')
    await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.dev')
    await page.getByLabel('Senha', { exact: true }).fill('senha123')
    await page.getByLabel('Confirmar senha', { exact: true }).fill('senha124')
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(page.getByText('As senhas não conferem.')).toBeVisible()

    await page.getByLabel('Confirmar senha', { exact: true }).fill('senha123')
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(page.getByText('Já existe uma conta com este e-mail.')).toBeVisible()

    await page.getByLabel('E-mail', { exact: true }).fill('nova@kurio.dev')
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.reload()
    await page.goto('/perfil')
    await expect(page.getByText('nova@kurio.dev')).toBeVisible()
  })

  test('login com credenciais inválidas e retorno ao fluxo anterior', async ({ page }) => {
    await page.goto('/favoritos')
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Ffavoritos/)

    await fillLogin(page, { email: USERS.ana.email, password: 'errada123' })
    await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible()

    await fillLogin(page, USERS.ana)
    await expect(page).toHaveURL(/\/favoritos$/)
    await expect(page.getByRole('heading', { name: 'Lista de interesse' })).toBeVisible()
    await expect(page.locator('main article')).toHaveCount(2)
  })

  test('sessão expirada redireciona para o login e permite retomar', async ({ page }) => {
    await signIn(page, USERS.ana, '/favoritos')
    await expect(page.locator('main article')).toHaveCount(2)

    await expireSessions(page)
    await page.reload()

    await expect(page).toHaveURL(/\/entrar\?.*motivo=expirada/)
    await expect(page.getByRole('alert').filter({ hasText: 'Sua sessão expirou' })).toBeVisible()

    await fillLogin(page, USERS.ana)
    await expect(page).toHaveURL(/\/favoritos$/)
  })

  test('logout e troca de usuário não expõem dados do usuário anterior', async ({ page }) => {
    await signIn(page, USERS.ana, '/favoritos')
    await expect(page.locator('main article')).toHaveCount(2)
    await expect(page.locator('main').getByText('Emerald Ape #042')).toBeVisible()

    await signOut(page)
    const stored = await page.evaluate(() => localStorage.getItem('kurio:session'))
    expect(stored).toBeNull()
    await page.goto('/perfil')
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil/)

    await signIn(page, USERS.bruno, '/favoritos')
    await expect(page.locator('main article')).toHaveCount(1)
    await expect(page.locator('main').getByText('Golden Beat #207')).toBeVisible()
    await expect(page.locator('main').getByText('Emerald Ape #042')).toHaveCount(0)
  })
})

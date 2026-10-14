import { expect, test } from '@playwright/test'
import { fillLogin, signIn, signOut, USERS } from '../support/auth.ts'
import { useScenario } from '../support/mock-scenario.ts'

const PNG_2X2 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('perfil e carteiras', () => {
  test.beforeEach(async ({ page }) => {
    await useScenario(page)
  })

  test('edição do perfil valida, trata conflito e persiste após refresh', async ({ page }) => {
    await signIn(page, USERS.ana, '/perfil')
    const displayName = page.getByLabel('Nome de exibição')
    const username = page.getByLabel('Nome de usuário')

    await displayName.fill('A')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Informe um nome de exibição com pelo menos 2 caracteres.')).toBeVisible()

    await displayName.fill('Ana Souza')
    await username.fill('bruno.nft')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Este nome de usuário já está em uso.')).toBeVisible()
    await expect(username).toHaveAttribute('aria-invalid', 'true')

    await username.fill('ana.souza')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Dados do perfil salvos.')).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Souza')
    await expect(page.getByLabel('Nome de usuário')).toHaveValue('ana.souza')
  })

  test('avatar valida o arquivo, envia, persiste e pode ser removido', async ({ page }) => {
    await signIn(page, USERS.ana, '/perfil')
    const input = page.locator('input[type="file"]')

    await input.setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('texto') })
    await expect(page.getByText('Envie uma imagem PNG, JPEG ou WebP.')).toBeVisible()

    await input.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_2X2 })
    await expect(page.getByText('Avatar atualizado.')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Avatar de Ana Colecionadora' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('img', { name: 'Avatar de Ana Colecionadora' })).toBeVisible()

    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByText('Avatar removido.')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Avatar de Ana Colecionadora' })).toHaveCount(0)
  })

  test('alteração de senha valida e passa a valer no próximo login', async ({ page }) => {
    await signIn(page, USERS.ana, '/perfil')
    const current = page.getByLabel('Senha atual', { exact: true })
    const next = page.getByLabel('Nova senha', { exact: true })
    const confirm = page.getByLabel('Confirmar nova senha', { exact: true })
    const submit = page.getByRole('button', { name: 'Alterar senha' })

    await current.fill('errada123')
    await next.fill('NovaSenha2026')
    await confirm.fill('OutraSenha2026')
    await submit.click()
    await expect(page.getByText('As senhas não conferem.')).toBeVisible()

    await confirm.fill('NovaSenha2026')
    await submit.click()
    await expect(page.getByText('Senha atual incorreta.')).toBeVisible()

    await current.fill(USERS.ana.password)
    await submit.click()
    await expect(page.getByText('Senha alterada com sucesso.')).toBeVisible()

    await signOut(page)
    await page.goto('/entrar')
    await fillLogin(page, USERS.ana)
    await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible()
    await fillLogin(page, { email: USERS.ana.email, password: 'NovaSenha2026' })
    await expect(page).not.toHaveURL(/\/entrar/)
  })

  test('cadastro e edição de carteiras principal e secundária', async ({ page }) => {
    await signIn(page, USERS.bruno, '/carteiras')
    const primary = page.getByRole('region', { name: 'Carteira principal' })

    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(primary.getByText('Informe um apelido com pelo menos 2 caracteres.')).toBeVisible()

    await primary.getByLabel('Apelido da carteira').fill('Principal do Bruno')
    await primary.getByLabel('Endereço da carteira').fill('0x123')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(primary.getByText('Informe um endereço 0x com 40 caracteres hexadecimais.')).toBeVisible()

    await primary.getByLabel('Endereço da carteira').fill('0x1111111111111111111111111111111111111111')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira principal salva.')).toBeVisible()

    const secondary = page.getByRole('region', { name: 'Carteira secundária' })
    await secondary.getByRole('button', { name: 'Adicionar' }).click()
    await secondary.getByLabel('Apelido da carteira').fill('Reserva do Bruno')
    await secondary.getByLabel('Endereço da carteira').fill('0x1111111111111111111111111111111111111111')
    await secondary.getByLabel('Rede').selectOption('polygon')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(secondary.getByText('Esta carteira já está cadastrada.')).toBeVisible()

    await secondary.getByLabel('Endereço da carteira').fill('0x2222222222222222222222222222222222222222')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira secundária salva.')).toBeVisible()

    await secondary.getByRole('button', { name: 'Tornar principal' }).click()
    await expect(page.getByText('Reserva do Bruno agora é a carteira principal.')).toBeVisible()
    await expect(primary.getByLabel('Apelido da carteira')).toHaveValue('Reserva do Bruno')

    await page.reload()
    await expect(page.getByRole('region', { name: 'Carteira principal' }).getByLabel('Apelido da carteira')).toHaveValue('Reserva do Bruno')
    await expect(page.getByRole('region', { name: 'Carteira secundária' }).getByLabel('Apelido da carteira')).toHaveValue('Principal do Bruno')
  })

  test('páginas da conta não têm overflow horizontal', async ({ page }) => {
    await signIn(page, USERS.ana, '/perfil')
    for (const path of ['/perfil', '/carteiras', '/favoritos', '/carrinho', '/pagamento']) {
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `${path} em ${width}px`).toBeLessThanOrEqual(0)
      }
    }
  })
})

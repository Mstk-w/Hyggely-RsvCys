import { test } from '@playwright/test'

test('ログイン画面デバッグ', async ({ page }) => {
  await page.goto('/admin/login')

  // スクリーンショット取得
  await page.screenshot({ path: 'e2e/screenshots/login-page.png', fullPage: true })

  // ボタンの状態を確認
  const loginButton = page.getByRole('button', { name: /ログイン/ })
  const isDisabled = await loginButton.isDisabled()
  const buttonText = await loginButton.textContent()

  console.log('Button disabled:', isDisabled)
  console.log('Button text:', buttonText)

  // ページのコンソールログを出力
  page.on('console', msg => console.log('Browser console:', msg.text()))

  // 少し待ってから再度確認
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'e2e/screenshots/login-page-after-wait.png', fullPage: true })

  const isDisabledAfter = await loginButton.isDisabled()
  const buttonTextAfter = await loginButton.textContent()

  console.log('After 3s - Button disabled:', isDisabledAfter)
  console.log('After 3s - Button text:', buttonTextAfter)
})

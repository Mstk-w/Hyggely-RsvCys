import { test, expect } from '@playwright/test'

test.describe('予約フォーム', () => {
  test('トップページが表示される', async ({ page }) => {
    await page.goto('/')

    // ページタイトルまたはヘッダーを確認
    await expect(page.locator('h2')).toContainText('商品を選択してください')
  })

  test('商品一覧が表示される', async ({ page }) => {
    await page.goto('/')

    // 商品カードが表示されることを確認
    const productCards = page.locator('.card')
    await expect(productCards.first()).toBeVisible()

    // 最初の商品名を確認（exactマッチ）
    await expect(page.getByRole('heading', { name: 'プレミアムカンパーニュ', exact: true })).toBeVisible()
  })

  test('商品をカートに追加できる', async ({ page }) => {
    await page.goto('/')

    // 「カートに追加」ボタンをクリック
    const addButton = page.getByRole('button', { name: 'カートに追加' }).first()
    await addButton.click()

    // カートに商品が追加されたことを確認（カートアイコンのバッジ）
    await expect(page.locator('.fixed.bottom-0')).toBeVisible()
  })

  test('受取日時選択ページに進める', async ({ page }) => {
    await page.goto('/')

    // 商品を追加
    const addButton = page.getByRole('button', { name: 'カートに追加' }).first()
    await addButton.click()

    // 「受取日時を選択」ボタンをクリック
    await page.getByRole('button', { name: '受取日時を選択' }).click()

    // 日時選択ページに遷移したことを確認
    await expect(page).toHaveURL(/\/datetime/)
  })
})

test.describe('管理画面', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/admin/login')

    // ログインフォームが表示されることを確認
    await expect(page.getByRole('heading', { name: 'Hyggely' })).toBeVisible()
    await expect(page.getByText('管理者ログイン')).toBeVisible()
    await expect(page.getByLabel('メールアドレス')).toBeVisible()
    await expect(page.getByLabel('パスワード')).toBeVisible()
  })

  test('未認証の場合はログインにリダイレクト', async ({ page }) => {
    await page.goto('/admin')

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})

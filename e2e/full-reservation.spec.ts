import { test, expect } from '@playwright/test'

test.describe('予約完了フローテスト', () => {
  test('予約を最後まで完了できる', async ({ page }) => {
    // ステップ1: 商品選択ページ
    await page.goto('http://localhost:5174/')
    
    // 商品一覧が表示されるまで待機
    await page.waitForSelector('.card', { timeout: 10000 })
    
    // スクリーンショット
    await page.screenshot({ path: 'e2e/screenshots/step1-products.png', fullPage: true })
    
    // 最初の「カートに追加」ボタンをクリック
    const addButton = page.getByRole('button', { name: 'カートに追加' }).first()
    await addButton.click()
    
    // カートサマリーが表示されることを確認
    await expect(page.locator('.fixed.bottom-0')).toBeVisible()
    
    // 「受取日時を選択」ボタンをクリック
    await page.getByRole('button', { name: '受取日時を選択' }).click()
    
    // ステップ2: 日時選択ページ
    await expect(page).toHaveURL(/\/datetime/)
    await page.screenshot({ path: 'e2e/screenshots/step2-datetime.png', fullPage: true })
    
    // 最初の日付を選択
    const dateButton = page.locator('button').filter({ hasText: /\d+\/\d+/ }).first()
    await dateButton.click()
    
    // 最初の時間帯を選択
    const timeButton = page.locator('button').filter({ hasText: /\d+:\d+-\d+:\d+/ }).first()
    await timeButton.click()
    
    // 「お客様情報へ」ボタンをクリック
    await page.getByRole('button', { name: 'お客様情報へ' }).click()
    
    // ステップ3: お客様情報入力ページ
    await expect(page).toHaveURL(/\/customer/)
    await page.screenshot({ path: 'e2e/screenshots/step3-customer.png', fullPage: true })
    
    // フォーム入力
    await page.getByLabel('お名前').fill('テスト太郎')
    await page.getByLabel('メールアドレス').fill('test@example.com')
    await page.getByLabel('電話番号').fill('09012345678')
    
    // 「確認画面へ」ボタンをクリック
    await page.getByRole('button', { name: '確認画面へ' }).click()
    
    // ステップ4: 確認ページ
    await expect(page).toHaveURL(/\/confirm/)
    await page.screenshot({ path: 'e2e/screenshots/step4-confirm.png', fullPage: true })
    
    // 予約情報が表示されていることを確認
    await expect(page.getByText('テスト太郎')).toBeVisible()
    await expect(page.getByText('test@example.com')).toBeVisible()
    
    // 「予約を確定する」ボタンをクリック
    const confirmButton = page.getByRole('button', { name: '予約を確定する' })
    await confirmButton.click()
    
    // ステップ5: 完了ページへ遷移
    await page.waitForURL(/\/complete/, { timeout: 15000 })
    await page.screenshot({ path: 'e2e/screenshots/step5-complete.png', fullPage: true })
    
    // 完了メッセージが表示されることを確認
    await expect(page.getByText(/ご予約ありがとうございます/)).toBeVisible()
  })
})

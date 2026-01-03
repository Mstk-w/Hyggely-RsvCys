# Firebase セットアップガイド

Hyggely予約システムのFirebase環境を1から構築する手順書です。

## 目次

1. [Firebaseプロジェクト作成](#1-firebaseプロジェクト作成)
2. [Firebase CLIインストール・ログイン](#2-firebase-cliインストールログイン)
3. [Firestore設定](#3-firestore設定)
4. [Authentication設定](#4-authentication設定)
5. [Storage設定](#5-storage設定)
6. [Hosting設定](#6-hosting設定)
7. [Cloud Functions設定](#7-cloud-functions設定)
8. [環境変数設定](#8-環境変数設定)
9. [初期データ投入](#9-初期データ投入)
10. [動作確認](#10-動作確認)

---

## 1. Firebaseプロジェクト作成

### 1.1 Firebase Consoleにアクセス

1. https://console.firebase.google.com/ にアクセス
2. Googleアカウントでログイン

### 1.2 新規プロジェクト作成

1. 「プロジェクトを追加」をクリック
2. プロジェクト名を入力: `hyggely-reservation` (任意の名前)
3. Google Analyticsは「有効にする」を推奨
4. 「プロジェクトを作成」をクリック

### 1.3 Webアプリ登録

1. プロジェクト概要画面で「</>」(Web)アイコンをクリック
2. アプリのニックネーム: `Hyggely Web App`
3. 「Firebase Hostingも設定する」にチェック
4. 「アプリを登録」をクリック
5. **表示されるfirebaseConfigをメモ** (後で使用)

```javascript
// この値をメモしておく
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "hyggely-reservation.firebaseapp.com",
  projectId: "hyggely-reservation",
  storageBucket: "hyggely-reservation.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 2. Firebase CLIインストール・ログイン

### 2.1 Firebase CLIインストール

```bash
# npmでグローバルインストール
npm install -g firebase-tools

# バージョン確認
firebase --version
```

### 2.2 Firebaseログイン

```bash
# ブラウザが開いてログイン
firebase login

# ログイン確認
firebase projects:list
```

### 2.3 プロジェクト連携

```bash
# プロジェクトディレクトリで実行
cd Hyggely-RsvCys

# .firebasercを作成/更新
firebase use --add

# 表示されるプロジェクト一覧から選択
# エイリアス名: default
```

**.firebaserc** が以下のように更新されます:
```json
{
  "projects": {
    "default": "hyggely-reservation"
  }
}
```

---

## 3. Firestore設定

### 3.1 Firestoreデータベース作成

1. Firebase Console > 左メニュー「Firestore Database」
2. 「データベースを作成」をクリック
3. **ロケーション選択**: `asia-northeast1 (Tokyo)` ← 重要！
4. セキュリティルール: 「本番環境モードで開始」を選択
5. 「有効にする」をクリック

### 3.2 セキュリティルールのデプロイ

```bash
# firestore.rulesをデプロイ
firebase deploy --only firestore:rules
```

### 3.3 インデックス設定

`firestore.indexes.json` を確認/作成:

```json
{
  "indexes": [
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "pickupDate", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

```bash
# インデックスをデプロイ
firebase deploy --only firestore:indexes
```

---

## 4. Authentication設定

### 4.1 Authenticationを有効化

1. Firebase Console > 左メニュー「Authentication」
2. 「始める」をクリック

### 4.2 メール/パスワード認証を有効化

1. 「Sign-in method」タブ
2. 「メール/パスワード」をクリック
3. 「有効にする」をトグルON
4. 「保存」

### 4.3 管理者ユーザー作成

1. 「Users」タブ
2. 「ユーザーを追加」をクリック
3. メールアドレスとパスワードを入力
4. 「ユーザーを追加」

**作成したユーザーのUIDをメモ** (Firestoreのadminsコレクションで使用)

---

## 5. Storage設定

### 5.1 Storageを有効化

1. Firebase Console > 左メニュー「Storage」
2. 「始める」をクリック
3. セキュリティルール: 「本番環境モードで開始」
4. ロケーション: `asia-northeast1` (Firestoreと同じ)
5. 「完了」

### 5.2 セキュリティルールのデプロイ

```bash
# storage.rulesをデプロイ
firebase deploy --only storage
```

### 5.3 商品画像フォルダ作成

Firebase Console > Storage で:
1. 「フォルダを作成」
2. フォルダ名: `products`

---

## 6. Hosting設定

### 6.1 Hostingを有効化

1. Firebase Console > 左メニュー「Hosting」
2. 「始める」をクリック
3. 画面の指示に従う（既にCLIインストール済みならスキップ可）

### 6.2 カスタムドメイン設定（オプション）

1. Hosting画面 > 「カスタムドメインを追加」
2. ドメイン名を入力
3. DNS設定の指示に従う

---

## 7. Cloud Functions設定

### 7.1 Blazeプラン（従量課金）へアップグレード

Cloud Functionsを使用するには有料プランが必要です:

1. Firebase Console > 左下「アップグレード」
2. 「Blaze」プランを選択
3. 支払い情報を設定

**注意**: 無料枠が十分にあるため、通常使用では課金はほぼ発生しません

### 7.2 Functions初期化

```bash
# プロジェクトディレクトリで実行
firebase init functions

# 選択肢:
# - 言語: TypeScript
# - ESLint: Yes
# - 依存関係インストール: Yes
```

### 7.3 Functions依存関係

`functions/package.json`:
```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "20"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "firebase-functions-test": "^3.0.0"
  }
}
```

---

## 8. 環境変数設定

### 8.1 フロントエンド環境変数

`.env.example` を `.env` にコピーして値を設定:

```bash
cp .env.example .env
```

`.env` を編集:
```env
VITE_FIREBASE_API_KEY=AIza...（手順1.3でメモした値）
VITE_FIREBASE_AUTH_DOMAIN=hyggely-reservation.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hyggely-reservation
VITE_FIREBASE_STORAGE_BUCKET=hyggely-reservation.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 8.2 Functions環境変数（Secrets）

```bash
# Gmail API用（メール送信機能で使用）
firebase functions:secrets:set GMAIL_CLIENT_ID
firebase functions:secrets:set GMAIL_CLIENT_SECRET
firebase functions:secrets:set GMAIL_REFRESH_TOKEN
```

---

## 9. 初期データ投入

### 9.1 管理者登録

Firebase Console > Firestore > 「コレクションを開始」

**adminsコレクション**:
```
コレクションID: admins
ドキュメントID: （手順4.3でメモしたUID）
フィールド:
  - email: "admin@example.com" (string)
  - name: "管理者" (string)
  - role: "owner" (string)
```

### 9.2 店舗設定

**settingsコレクション**:
```
コレクションID: settings
ドキュメントID: store
フィールド:
  - name: "Hyggely" (string)
  - address: "愛知県みよし市三好丘緑2-10-4" (string)
  - phone: "0561-XX-XXXX" (string)
  - email: "info@hyggely.com" (string)
  - defaultTimeSlots: ["10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"] (array)
  - regularBusinessDays: [3, 6] (array) // 水曜=3, 土曜=6
```

### 9.3 サンプル商品

**productsコレクション**:
```
コレクションID: products
ドキュメントID: (自動生成)
フィールド:
  - name: "カンパーニュ プレーン" (string)
  - description: "シンプルで飽きのこない定番のカンパーニュ" (string)
  - price: 800 (number)
  - stock: 10 (number)
  - imageUrl: "" (string)
  - category: "カンパーニュ" (string)
  - isAvailable: true (boolean)
  - sortOrder: 1 (number)
  - createdAt: (現在時刻)
  - updatedAt: (現在時刻)
```

### 9.4 営業日設定

**businessDaysコレクション**:
```
コレクションID: businessDays
ドキュメントID: 2025-01
フィールド:
  - 2025-01-04: { isOpen: true, timeSlots: [...], note: "" } (map)
  - 2025-01-08: { isOpen: true, timeSlots: [...], note: "" } (map)
  - 2025-01-11: { isOpen: true, timeSlots: [...], note: "" } (map)
  ... (水曜・土曜を設定)
```

---

## 10. 動作確認

### 10.1 ローカル開発サーバー起動

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

http://localhost:5173 にアクセス

### 10.2 Firebaseエミュレータ起動（オプション）

```bash
# Functions依存関係インストール
npm --prefix functions install

# エミュレータ起動
firebase emulators:start
```

エミュレータUI: http://localhost:4000

### 10.3 本番デプロイ

```bash
# ビルド
npm run build

# 全サービスデプロイ
firebase deploy

# または個別デプロイ
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 10.4 デプロイ後確認

1. Hosting URL にアクセス（Firebase Consoleに表示）
2. 予約フォームが表示されることを確認
3. 管理画面にログインできることを確認

---

## トラブルシューティング

### Firebase CLIでログインできない

```bash
# キャッシュクリア
firebase logout
firebase login --reauth
```

### Firestoreルールのエラー

```bash
# ルールのテスト
firebase emulators:start --only firestore
# エミュレータUIでルールテストを実行
```

### Functions デプロイエラー

```bash
# Node.jsバージョン確認
node --version  # 20.x推奨

# 依存関係再インストール
cd functions
rm -rf node_modules
npm install
cd ..
```

### 環境変数が読み込まれない

1. `.env` ファイルがプロジェクトルートにあるか確認
2. 変数名が `VITE_` で始まっているか確認
3. 開発サーバーを再起動

---

## 次のステップ

1. [frontend-build](../.claude/skills/frontend-build/SKILL.md) スキルでフロントエンド構築
2. [backend-build](../.claude/skills/backend-build/SKILL.md) スキルでCloud Functions構築
3. [firebase-deploy](../.claude/skills/firebase-deploy/SKILL.md) スキルで本番デプロイ

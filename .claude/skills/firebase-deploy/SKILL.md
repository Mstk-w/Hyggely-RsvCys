---
name: firebase-deploy
description: |
  Firebaseデプロイおよび再デプロイスキル。Hosting、Functions、Firestore rules、Storage rulesのデプロイを行う。以下の場合に使用:
  (1) firebase deploy で全サービスをデプロイする時
  (2) Hostingのみ、Functionsのみなど個別デプロイする時
  (3) Firestore/Storageセキュリティルールをデプロイする時
  (4) デプロイエラーを解決する時
  (5) 「デプロイして」「再デプロイ」「本番反映して」などのリクエスト時
  (6) デプロイ前のビルド確認やプレビューチャンネルへのデプロイ時
---

# Firebase Deploy Skill

Firebaseへのデプロイおよび再デプロイ手順。

## サブエージェント機能

### pre-deploy-validator（デプロイ前並列検証）

デプロイ前に4項目を並列で検証し、問題を事前に発見。

**使用タイミング**: `firebase deploy`実行前

**実行方法**:
```
Task tool使用（4つ並列実行）:
- subagent_type: "general-purpose"
- model: "haiku"
- run_in_background: true（並列実行）
```

**4項目の並列検証**:
```typescript
// 並列で4つのチェックを実行
Task("frontend-build-check", model: "haiku")
  → npm run build が成功するか確認
  → dist/フォルダの生成確認

Task("functions-build-check", model: "haiku")
  → npm --prefix functions run build が成功するか確認
  → TypeScriptエラーがないか確認

Task("rules-validation", model: "haiku")
  → firestore.rulesの構文チェック
  → storage.rulesの構文チェック

Task("env-config-check", model: "haiku")
  → .envファイルの存在確認
  → 必須環境変数の設定確認
  → firebase.jsonの設定確認
```

**プロンプト例（frontend-build-check）**:
```
フロントエンドビルドの検証を行ってください:

1. npm run build を実行
2. ビルド成功を確認
3. dist/フォルダの生成を確認
4. 主要ファイル（index.html, assets/）の存在確認

問題があれば詳細と修正方法を報告。
```

**プロンプト例（rules-validation）**:
```
Firebaseセキュリティルールを検証してください:

ファイル: firestore.rules, storage.rules

チェック項目:
1. 構文エラーがないか
2. セキュリティホール（誰でも読み書き可能なルール等）
3. 本番環境で問題になる設定

問題があれば具体的な修正案を提示。
```

### post-deploy-checker（デプロイ後検証）

デプロイ完了後、本番環境の動作を自動検証。

**使用タイミング**: `firebase deploy`成功後

**実行方法**:
```
Task tool使用:
- subagent_type: "general-purpose"
- model: "sonnet"
```

**プロンプト例**:
```
Firebaseデプロイ後の検証を行ってください:

プロジェクト: [PROJECT_ID]
デプロイ対象: Hosting, Functions, Firestore rules

検証項目:
1. Hosting: https://PROJECT_ID.web.app にアクセス可能か
2. Functions: エンドポイントが応答するか
3. Firestore: 基本的な読み書きが動作するか

問題があれば詳細と対処方法を報告。
```

**エラー時の自動対応**:
```typescript
// デプロイ後検証でエラー発見
Task("diagnose-hosting-error", model: "sonnet")
  → 404エラー: dist/の内容確認、firebase.json設定確認
  → 500エラー: Functionsログ確認、依存関係確認

Task("diagnose-functions-error", model: "sonnet")
  → タイムアウト: メモリ/タイムアウト設定確認
  → 権限エラー: IAM設定確認
```

## 前提条件

```bash
# Firebase CLI確認
firebase --version

# ログイン
firebase login

# プロジェクト確認
firebase projects:list

# 現在のプロジェクト確認
firebase use
```

## デプロイコマンド一覧

| コマンド | 説明 |
|---------|------|
| `firebase deploy` | 全サービスデプロイ |
| `firebase deploy --only hosting` | Hostingのみ |
| `firebase deploy --only functions` | Functionsのみ |
| `firebase deploy --only firestore:rules` | Firestoreルールのみ |
| `firebase deploy --only storage` | Storageルールのみ |

## デプロイワークフロー（サブエージェント活用）

### 1. 本番デプロイ（全サービス）

```bash
# 【推奨】pre-deploy-validatorで事前検証（4項目並列）
# → Task toolで4つの検証を並列実行

# フロントエンドビルド
npm run build

# 全サービスデプロイ
firebase deploy

# 【推奨】post-deploy-checkerでデプロイ後検証
# → Task toolで本番環境を検証
```

### 2. Hostingのみデプロイ

```bash
# ビルド
npm run build

# Hostingデプロイ
firebase deploy --only hosting
```

### 3. Functionsのみデプロイ

```bash
# Functionsビルド
npm --prefix functions run build

# Functionsデプロイ
firebase deploy --only functions
```

### 4. セキュリティルールのみデプロイ

```bash
# Firestoreルール
firebase deploy --only firestore:rules

# Storageルール
firebase deploy --only storage

# 両方
firebase deploy --only firestore:rules,storage
```

## 再デプロイ

### 変更後の再デプロイ

```bash
# ビルド + デプロイ（ワンライナー）
npm run build && firebase deploy --only hosting
```

### ロールバック

```bash
# Hostingの過去バージョン一覧
firebase hosting:channel:list

# 特定バージョンにロールバック（Firebase Consoleから推奨）
```

## プレビューデプロイ

### プレビューチャンネル

```bash
# プレビューURLにデプロイ（7日間有効）
firebase hosting:channel:deploy preview

# 有効期限指定（30日）
firebase hosting:channel:deploy preview --expires 30d

# プレビューチャンネル削除
firebase hosting:channel:delete preview
```

## デプロイ前チェックリスト

### Hosting

- [ ] `npm run build` 成功
- [ ] `dist/`フォルダ生成確認
- [ ] 環境変数（.env）設定確認
- [ ] `npm run preview`でローカル確認

### Functions

- [ ] `npm --prefix functions run build` 成功
- [ ] TypeScriptエラーなし
- [ ] 環境変数/Secrets設定確認
- [ ] エミュレータでテスト済み

### Firestore Rules

- [ ] `firestore.rules`構文確認
- [ ] エミュレータでテスト済み
- [ ] 本番データへの影響確認

## エラー対処

### デプロイ失敗時

```bash
# 詳細ログ付きデプロイ
firebase deploy --debug
```

### Hosting デプロイエラー

1. `dist/`フォルダ存在確認
2. `firebase.json`の`hosting.public`確認
3. ビルド再実行: `npm run build`

### Functions デプロイエラー

1. Node.jsバージョン確認
2. `functions/package.json`の依存関係確認
3. ビルドエラー確認: `npm --prefix functions run build`

### 権限エラー

```bash
# 再ログイン
firebase logout
firebase login

# プロジェクト再選択
firebase use --add
```

## 本番URL

デプロイ後のURL形式:
- Hosting: `https://PROJECT_ID.web.app` または `https://PROJECT_ID.firebaseapp.com`
- Functions: `https://REGION-PROJECT_ID.cloudfunctions.net/FUNCTION_NAME`

## CI/CDデプロイ

### GitHub Actions用トークン取得

```bash
# CIトークン生成
firebase login:ci
```

### 環境変数

```yaml
# GitHub Secrets に設定
FIREBASE_TOKEN: <firebase login:ci で取得したトークン>
```

## サブエージェント活用フロー

```
[デプロイ開始]
      │
      ▼
┌─────────────────────┐
│ pre-deploy-validator │
│ (4項目並列検証)       │
└─────────────────────┘
      │
  ┌───┼───┬───┐
  ▼   ▼   ▼   ▼
Build Func Rules Env
Check Check Valid Check
  │   │   │   │
  └───┴───┴───┘
      │
      ▼
  全チェックOK?
   │Yes    │No
   ▼       ▼
deploy  問題修正
   │      ↑
   ▼      │
成功?─No──┘
   │Yes
   ▼
┌────────────────────┐
│ post-deploy-checker │
│ (本番動作検証)       │
└────────────────────┘
      │
      ▼
    完了
```

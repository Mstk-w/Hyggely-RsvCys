---
name: frontend-build
description: |
  React + TypeScript + Viteプロジェクトのフロントエンド構築スキル。開発サーバー起動、本番ビルド、依存関係インストール、リント実行を行う。以下の場合に使用:
  (1) npm install で依存関係をインストールする時
  (2) npm run dev で開発サーバーを起動する時
  (3) npm run build で本番ビルドを実行する時
  (4) npm run lint でコード品質チェックを行う時
  (5) ビルドエラーやTypeScriptエラーを解決する時
  (6) 「フロントエンドを構築して」「ビルドして」「開発サーバー起動して」などのリクエスト時
---

# Frontend Build Skill

React + TypeScript + Vite環境でのフロントエンド構築手順。

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm install` | 依存関係インストール |
| `npm run dev` | 開発サーバー起動 (localhost:5173) |
| `npm run build` | 本番ビルド (tsc + vite build) |
| `npm run preview` | ビルド結果プレビュー |
| `npm run lint` | ESLintによるコード品質チェック |

## ビルドワークフロー

### 1. 初回セットアップ

```bash
# 依存関係インストール
npm install

# 環境変数設定（.env.exampleをコピー）
cp .env.example .env
# Firebase設定値を.envに入力
```

### 2. 開発時

```bash
# 開発サーバー起動（HMR有効）
npm run dev
```

### 3. 本番ビルド

```bash
# TypeScriptコンパイル + Viteビルド
npm run build

# ビルド結果確認
npm run preview
```

## サブエージェント機能

### error-analyzer（エラー並列分析）

ビルドエラー発生時、複数のエラーを並列で分析・修正提案。

**使用タイミング**: `npm run build`でエラーが複数発生した時

**実行方法**:
```
Task tool使用:
- subagent_type: "general-purpose"
- model: "haiku"（単純エラー）/ "sonnet"（複雑なエラー）
- 複数エラーは並列でTask toolを呼び出し
```

**プロンプト例**:
```
以下のTypeScriptエラーを分析し、修正方法を提案してください:
[エラーメッセージ]

対象ファイル: src/components/XXX.tsx
修正コードを具体的に示してください。
```

**並列実行パターン**:
```typescript
// 3つのエラーを並列分析
Task(error1, model: "haiku") // 型エラー
Task(error2, model: "haiku") // import エラー
Task(error3, model: "sonnet") // 複雑なジェネリクスエラー
```

### code-quality-checker（品質チェック）

ビルド前にコード品質を事前検証。

**使用タイミング**: 本番ビルド前、PR作成前

**実行方法**:
```
Task tool使用:
- subagent_type: "Explore"
- model: "haiku"
- thoroughness: "medium"
```

**プロンプト例**:
```
src/配下のReactコンポーネントを分析し、以下の観点でチェック:
1. 未使用のimport/変数
2. any型の使用箇所
3. useEffect依存配列の問題
4. パフォーマンス問題（不要な再レンダリング）

問題箇所をファイル:行番号形式でリストアップ。
```

## エラー対処

### TypeScriptエラー

1. `npm run build`でエラー発生時、エラーメッセージの型エラーを確認
2. **複数エラー時はerror-analyzerサブエージェントを並列実行**
3. `src/`配下の該当ファイルを修正
4. `tsconfig.json`の設定確認（strict mode等）

### 依存関係エラー

```bash
# node_modules削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### Viteビルドエラー

1. `vite.config.ts`の設定確認
2. パスエイリアス（@/）の解決確認
3. 環境変数（VITE_*）の設定確認

## 環境変数

必須のFirebase設定（.envファイル）:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## ビルド出力

- 出力先: `dist/`
- HTML/JS/CSSが最適化されて出力
- Firebase Hostingにデプロイ可能な状態

## サブエージェント活用フロー

```
[npm run build 実行]
        │
        ▼
   ┌─────────────┐
   │ ビルド成功？ │
   └─────────────┘
     │Yes    │No
     ▼       ▼
  完了   ┌──────────────────┐
         │ エラー数確認      │
         └──────────────────┘
              │
         ┌────┴────┐
         │         │
     1-2個     3個以上
         │         │
         ▼         ▼
     直接修正   error-analyzer
               (並列実行)
```

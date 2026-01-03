---
name: backend-build
description: |
  Firebase Cloud Functionsのバックエンド構築スキル。Cloud Functionsの開発、ビルド、ローカルテストを行う。以下の場合に使用:
  (1) functions/配下のCloud Functionsを開発する時
  (2) Cloud Functionsの依存関係をインストールする時
  (3) Firebaseエミュレータでローカルテストする時
  (4) Cloud Functionsのビルドエラーを解決する時
  (5) 「バックエンドを構築して」「Functions作って」「エミュレータ起動して」などのリクエスト時
  (6) メール送信機能やサーバーサイド処理を実装する時
---

# Backend Build Skill

Firebase Cloud Functionsでのバックエンド構築手順。

## ディレクトリ構造

```
functions/
├── src/
│   └── index.ts       # Cloud Functions エントリポイント
├── package.json       # Functions用依存関係
├── tsconfig.json      # TypeScript設定
└── .eslintrc.js       # ESLint設定
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm --prefix functions install` | Functions依存関係インストール |
| `npm --prefix functions run build` | TypeScriptビルド |
| `npm --prefix functions run serve` | ローカルサーバー起動 |
| `firebase emulators:start` | 全エミュレータ起動 |
| `firebase emulators:start --only functions` | Functionsエミュレータのみ |

## サブエージェント機能

### functions-scaffolder（テンプレート生成）

新しいCloud Function作成時、既存パターンを分析してテンプレートを生成。

**使用タイミング**: 新規Function作成時

**実行方法**:
```
Task tool使用:
- subagent_type: "Explore"
- model: "sonnet"
- thoroughness: "medium"
```

**プロンプト例**:
```
functions/src/配下の既存Cloud Functionsを分析し、
以下の要件に合うFunctionテンプレートを生成してください:

要件: [予約確認メール送信Function]
トリガー: Firestoreドキュメント作成時
処理内容: 予約データを取得してメール送信

既存コードのパターン（命名規則、エラーハンドリング、ログ出力）に従ってください。
```

**生成パターン**:
```typescript
// 既存パターンを分析 → 一貫性のあるコード生成
// - 命名規則: onXxxCreated, onXxxUpdated
// - エラーハンドリング: try-catch + logger
// - 戻り値: 成功/失敗ステータス
```

### log-analyzer（ログ分析）

Functionsのエラーログを分析して原因を特定。

**使用タイミング**: ランタイムエラー発生時、デバッグ時

**実行方法**:
```
Task tool使用:
- subagent_type: "general-purpose"
- model: "sonnet"（複雑なエラー分析向け）
```

**プロンプト例**:
```
以下のCloud Functionsエラーログを分析してください:

[ログ内容を貼り付け]

分析内容:
1. エラーの根本原因
2. 影響範囲
3. 修正方法（コード例付き）
4. 再発防止策
```

**並列分析パターン**:
```typescript
// 複数のエラーログを並列分析
Task(log1, "HTTPトリガーのタイムアウトエラー", model: "haiku")
Task(log2, "Firestoreトリガーの権限エラー", model: "sonnet")
Task(log3, "外部API呼び出しの失敗", model: "sonnet")
```

## セットアップワークフロー

### 1. Cloud Functions初期化（未作成の場合）

```bash
# Firebase CLI確認
firebase --version

# Functions初期化（TypeScript選択推奨）
firebase init functions
```

### 2. 依存関係インストール

```bash
cd functions
npm install
cd ..
```

### 3. 開発

```bash
# functions/src/index.ts を編集

# ビルド
npm --prefix functions run build
```

## Cloud Functions実装パターン

### HTTPトリガー

```typescript
import { onRequest } from "firebase-functions/v2/https";

export const api = onRequest((req, res) => {
  res.send("Hello from Firebase!");
});
```

### Firestoreトリガー

```typescript
import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const onReservationCreated = onDocumentCreated(
  "reservations/{docId}",
  (event) => {
    const data = event.data?.data();
    // 予約作成時の処理
  }
);
```

### スケジュール実行

```typescript
import { onSchedule } from "firebase-functions/v2/scheduler";

export const dailyTask = onSchedule("every day 09:00", async () => {
  // 毎日9時に実行
});
```

## ローカルテスト

### エミュレータ起動

```bash
# 全サービスエミュレータ
firebase emulators:start

# Functions + Firestoreのみ
firebase emulators:start --only functions,firestore
```

### エミュレータUI

- http://localhost:4000 でエミュレータUIにアクセス
- Functions、Firestore、Authの状態を確認可能

## エラー対処

### ビルドエラー

1. `npm --prefix functions run build`でエラー確認
2. TypeScript型エラーを修正
3. `functions/tsconfig.json`の設定確認

### デプロイエラー

1. Node.jsバージョン確認（firebase.jsonで指定）
2. 依存関係のバージョン互換性確認
3. `functions/package.json`のenginesフィールド確認

### ランタイムエラー

1. Firebase Consoleでログ確認
2. `firebase functions:log`でログ取得
3. **log-analyzerサブエージェントでログ分析**
4. エミュレータでローカルデバッグ

## 環境変数（Secrets）

```bash
# シークレット設定
firebase functions:secrets:set SECRET_NAME

# シークレット一覧
firebase functions:secrets:access SECRET_NAME
```

## Gmail API連携（メール送信）

1. Google Cloud Consoleでプロジェクト作成
2. Gmail APIを有効化
3. OAuth2認証情報を取得
4. リフレッシュトークンをSecretsに保存

## サブエージェント活用フロー

```
[新規Function作成]
        │
        ▼
┌───────────────────┐
│ functions-scaffolder │
│ (既存パターン分析)    │
└───────────────────┘
        │
        ▼
   テンプレート生成
        │
        ▼
     実装・テスト
        │
   ┌────┴────┐
   │         │
 成功      エラー
   │         │
   ▼         ▼
デプロイ  log-analyzer
         (原因特定)
```

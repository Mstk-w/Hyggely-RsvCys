---
name: github-update
description: |
  GitおよびGitHub操作スキル。コミット、プッシュ、PR作成、ブランチ管理を行う。以下の場合に使用:
  (1) git add/commit/pushで変更をコミット・プッシュする時
  (2) GitHubにプルリクエストを作成する時
  (3) ブランチを作成・切り替え・マージする時
  (4) git statusで変更状態を確認する時
  (5) 「GitHubに上げて」「コミットして」「PRを作って」などのリクエスト時
  (6) リポジトリの初期化やリモート設定を行う時
---

# GitHub Update Skill

Git/GitHubでのバージョン管理とコード共有手順。

## サブエージェント機能

### change-reviewer（変更並列レビュー）

コミット前に変更ファイルを並列でレビュー。

**使用タイミング**: コミット前、PR作成前

**実行方法**:
```
Task tool使用:
- subagent_type: "general-purpose"
- model: "haiku"（単純な変更）/ "sonnet"（複雑なロジック）
- 複数ファイルは並列でTask toolを呼び出し
```

**プロンプト例**:
```
以下のファイル変更をレビューしてください:

ファイル: src/components/ReservationForm.tsx
変更内容: [git diffの出力]

チェック観点:
1. バグの可能性
2. セキュリティリスク（XSS, インジェクション等）
3. パフォーマンス問題
4. コーディング規約違反

問題があれば具体的な修正案を提示。
```

**並列レビューパターン**:
```typescript
// 5ファイルの変更を並列レビュー
Task(file1, model: "haiku")  // 単純なスタイル変更
Task(file2, model: "haiku")  // import追加
Task(file3, model: "sonnet") // ビジネスロジック変更
Task(file4, model: "sonnet") // API呼び出し変更
Task(file5, model: "haiku")  // 型定義追加
```

### commit-message-generator（メッセージ自動生成）

変更内容を分析してConventional Commits形式のメッセージを自動生成。

**使用タイミング**: コミット時

**実行方法**:
```
Task tool使用:
- subagent_type: "general-purpose"
- model: "haiku"
```

**プロンプト例**:
```
以下のgit diffから適切なコミットメッセージを生成してください:

[git diff --staged の出力]

形式: Conventional Commits
<type>(<scope>): <subject>

Type: feat/fix/docs/style/refactor/test/chore
Scope: 変更対象のモジュール/機能名
Subject: 50文字以内、現在形、小文字始まり

日本語で簡潔に。例:
- feat(reservation): 予約フォームのバリデーション追加
- fix(auth): ログインエラー時のハンドリング修正
```

### conflict-resolver（コンフリクト解消支援）

マージコンフリクトを分析して解消方法を提案。

**使用タイミング**: git merge/rebase時にコンフリクト発生

**実行方法**:
```
Task tool使用:
- subagent_type: "general-purpose"
- model: "sonnet"（コンテキスト理解が必要）
```

**プロンプト例**:
```
以下のマージコンフリクトを分析し、解消方法を提案してください:

ファイル: src/stores/reservationStore.ts

<<<<<<< HEAD
[現在のブランチのコード]
=======
[マージ元のコード]
>>>>>>> feature/new-feature

分析内容:
1. 両方の変更の意図
2. 推奨する解消方法（コード付き）
3. 解消時の注意点
```

**並列解消パターン**:
```typescript
// 複数ファイルのコンフリクトを並列分析
Task(conflict1, "reservationStore.ts", model: "sonnet")
Task(conflict2, "useReservation.ts", model: "sonnet")
Task(conflict3, "types.ts", model: "haiku") // 型定義は単純
```

## 初期セットアップ

### リポジトリ初期化（未初期化の場合）

```bash
# Git初期化
git init

# リモート追加
git remote add origin https://github.com/USERNAME/REPO.git

# 初回プッシュ
git push -u origin main
```

### GitHub CLI認証

```bash
# GitHub CLIログイン
gh auth login

# 認証状態確認
gh auth status
```

## 基本ワークフロー

### 1. 変更確認

```bash
# 変更状態確認
git status

# 差分確認
git diff

# ステージング済み差分
git diff --staged
```

### 2. コミット（サブエージェント活用）

```bash
# 全変更をステージング
git add .

# 【推奨】commit-message-generatorでメッセージ生成
# → Task toolで git diff --staged を分析

# コミット
git commit -m "feat: 新機能を追加"
```

### 3. プッシュ

```bash
# 現在のブランチをプッシュ
git push

# 初回プッシュ（上流設定）
git push -u origin feature/new-feature
```

## ブランチ操作

### 新規ブランチ作成

```bash
git checkout -b feature/new-feature
# または
git switch -c feature/new-feature
```

### ブランチ切り替え

```bash
git checkout main
# または
git switch main
```

### ブランチ一覧

```bash
# ローカルブランチ
git branch

# リモート含む全ブランチ
git branch -a
```

## プルリクエスト

### PR作成（GitHub CLI）

```bash
# インタラクティブにPR作成
gh pr create

# タイトルと本文指定
gh pr create --title "feat: 予約機能追加" --body "## 概要\n予約フォームを追加"

# ドラフトPR
gh pr create --draft
```

### PR確認・マージ

```bash
# PR一覧
gh pr list

# PR詳細
gh pr view 123

# PRマージ
gh pr merge 123
```

## コミットメッセージ規約

### Conventional Commits形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type一覧

| Type | 説明 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `style` | コードスタイル（動作変更なし） |
| `refactor` | リファクタリング |
| `test` | テスト追加・修正 |
| `chore` | ビルド・設定変更 |

## トラブルシューティング

### コンフリクト解消（サブエージェント活用）

```bash
# 最新を取得
git fetch origin
git merge origin/main

# コンフリクトファイル確認
git status

# 【推奨】conflict-resolverで解消方法を分析
# → Task toolでコンフリクト内容を分析

# 手動で解消後
git add .
git commit -m "merge: mainからのマージ、コンフリクト解消"
```

### 直前のコミット修正

```bash
# メッセージ修正
git commit --amend -m "新しいメッセージ"

# ファイル追加忘れ
git add forgotten-file.ts
git commit --amend --no-edit
```

### 変更の取り消し

```bash
# ステージング取り消し
git restore --staged file.ts

# ファイルの変更取り消し
git restore file.ts

# 直前のコミット取り消し（変更は保持）
git reset --soft HEAD~1
```

## サブエージェント活用フロー

```
[コミット前]
     │
     ▼
┌─────────────────┐
│ change-reviewer │ ←── 並列レビュー
│ (品質チェック)   │     (複数ファイル同時)
└─────────────────┘
     │
     ▼
┌─────────────────────────┐
│ commit-message-generator │
│ (メッセージ自動生成)      │
└─────────────────────────┘
     │
     ▼
  git commit
     │
     ▼
  git push
     │
┌────┴────┐
│         │
成功   コンフリクト
│         │
▼         ▼
完了   conflict-resolver
      (解消方法提案)
```

## .gitignore

機密情報や不要ファイルを除外:

```
# 環境変数
.env
.env.local

# 依存関係
node_modules/

# ビルド出力
dist/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

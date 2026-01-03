# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hyggely事前受取予約システム - 愛知県みよし市のカンパーニュ専門店「Hyggely」向けの予約フォームと管理ダッシュボード。

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Backend**: Firebase (Firestore, Auth, Storage, Functions, Hosting)
- **Email**: Gmail API via Cloud Functions

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Deploy to Firebase
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

## Project Structure

```
src/
├── components/
│   ├── reservation/    # 予約フォームコンポーネント
│   └── admin/          # 管理画面コンポーネント
├── pages/
│   ├── reservation/    # 予約フォームページ
│   └── admin/          # 管理画面ページ
├── stores/             # Zustand stores
├── types/              # TypeScript型定義
├── lib/
│   ├── firebase.ts     # Firebase初期化
│   └── utils.ts        # ユーティリティ関数
└── hooks/              # カスタムフック

functions/              # Cloud Functions (メール送信等)
docs/                   # 設計書・マニュアル
```

## Key Files

- `src/lib/firebase.ts` - Firebase initialization
- `src/stores/reservationStore.ts` - Reservation form state
- `src/stores/authStore.ts` - Admin authentication state
- `firestore.rules` - Firestore security rules
- `storage.rules` - Storage security rules

## Firestore Collections

- `products` - 商品マスタ
- `reservations` - 予約データ
- `customers` - 顧客データ
- `businessDays` - 営業日設定
- `settings` - 店舗設定
- `admins` - 管理者

## Environment Variables

Copy `.env.example` to `.env` and fill in Firebase config:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Firebase Setup

1. Create Firebase project at console.firebase.google.com
2. Enable Firestore (asia-northeast1)
3. Enable Authentication (Email/Password)
4. Enable Storage
5. Enable Hosting
6. Update `.firebaserc` with your project ID

## Development Notes

- 営業日は水曜日と土曜日（臨時休業/営業あり）
- 受取時間帯は1時間刻み（10:00-17:00）
- 在庫はリアルタイムで管理
- 予約番号フォーマット: HYG-YYYYMMDD-XXX

## Path Aliases

`@/*` maps to `./src/*` for cleaner imports:
```typescript
import { useReservationStore } from '@/stores/reservationStore'
```

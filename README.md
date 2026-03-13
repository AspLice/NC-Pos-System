# NC POS System

React + Vite + Firebase (Firestore / Storage / Hosting) ベースのPOSシステムです。

## セットアップ

1. `.env.example` をコピーして `.env` を作成
2. Firebase Web SDK の値を設定
3. 依存をインストールして起動

```bash
npm install
npm run dev
```

必要な環境変数:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## APIキー露出警告への対処

Firebase Web の `apiKey` はクライアントから見える値ですが、**必ず制限**してください。

### 1) 既存キーを制限（最優先）

Google Cloud Console → `API とサービス` → `認証情報` → 該当APIキー:

- `アプリケーションの制限`: `HTTP リファラー（ウェブサイト）`
- 許可リファラー例:
  - `https://krr-pos-system.web.app/*`
  - `https://krr-pos-system.firebaseapp.com/*`
  - `http://localhost:5173/*`
- `API の制限`: Firebaseで必要なAPIのみに限定

### 2) キーをローテーション

- 新しいWeb APIキーを作成し、上記と同じ制限を適用
- `.env` の `VITE_FIREBASE_API_KEY` を新キーへ更新
- デプロイ後、旧キーを無効化

### 3) 追加防御（推奨）

- Firebase App Check を有効化（Firestore / Storage を保護）
- Firestore / Storage セキュリティルールを再確認

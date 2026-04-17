# 🛡️ Log Masker - Secure Log Anonymization Tool

ログや設定ファイルに含まれる機微情報を、**ブラウザ上だけで**自動的に検知・マスキングするセキュリティツールです。
開発者間でのログ共有を、より安全・スピーディにすることを目的としています。

---

## ✨ 特徴

- **100% Client-Side:** 入力されたデータは一切サーバーに送信されません。すべての処理はあなたのブラウザ内（メモリ上）で完結します。
- **Auto Detection:** 正規表現を用いて、メールアドレス、IPアドレス、電話番号などの主要な個人情報を瞬時に特定。
- **Clean UI:** マテリアルデザインに基づいた直感的な2ペインインターフェース。
- **Real-time:** テキストを貼り付けた瞬間にマスキング結果が反映されます。

## 🔍 マスキングルール一覧

| 項目 | 変換前 (例) | 変換後 (例) |
| :--- | :--- | :--- |
| **メールアドレス** | `user@company.com` | `xxx@example.jp` |
| **IPv4アドレス** | `192.168.1.1` | `xxx.xxx.xxx.xxx` |
| **IPv6アドレス** | `2001:0db8::0001` | `xxxx:xxxx:xxxx:xxxx...` |
| **電話番号** | `090-1234-5678` | `xxx-xxxx-xxxx` |
| **APIキー / トークン** | `Bearer sk_live_...` | `[REDACTED_API_KEY]` |
| **MACアドレス** | `00:1B:44:11:3A:B7` | `xx:xx:xx:xx:xx:xx` |

## 🚀 使い方

1. [公開URL] にアクセスします。
2. 左側のテキストエリアにログの内容を貼り付けます。
3. 右側に生成されたマスキング済みのテキストを確認し、「Copy」ボタンで取得します。
4. 終了時は「Clear」ボタンでメモリ上のデータを完全に消去できます。

## 🛠️ 技術スタック

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Hosting:** GitHub Pages

## 📦 開発者向けセットアップ

```bash
# クローン
git clone [https://github.com/あなたのユーザー名/log-masker.git](https://github.com/あなたのユーザー名/log-masker.git)

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# デプロイ (GitHub Pages)
npm run deploy
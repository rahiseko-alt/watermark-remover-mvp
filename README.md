# Watermark Remover MVP (AI電子透かし・メタデータ除去 SaaS)

AI生成コンテンツ（テキスト・画像・文書）に含まれる機械可読情報・不可視透かしを高精度に検査・決定論的に除去するプライバシー重視のSaaS MVPです。

OSS `guillaumemeyer/watermarks-remover` の設計思想に基づき、LLMやGPUに依存しない**Layer 1（メタデータ型）**および**Layer 2（不可視文字型）**の決定論的クレンジングを安全かつ高速に実行します。

---

## 🎯 MVP対応範囲 & セキュリティ保証

| 区分 | 主な対象 | 処理の性質 | MVP対応 |
|---|---|---|---|
| **1. メタデータ型** | C2PA / Content Credentials, EXIF, XMP, IPTC, PNG prompt chunks, DOCXプロパティ, PDF Info/XMP | 決定論的剥離 | **✓ 完全対応** |
| **2. 不可視文字型** | ゼロ幅文字 (ZWSP/ZWNJ/ZWNBSP), Unicode Tags (U+E0001〜U+E007F), Bidi制御文字, PUA | 除去・NFC正規化 | **✓ 完全対応** |
| 3. 統計的テキスト透かし | トークン選択・文章パターン | LLMリライト | Phase 2 |
| 4. 画像ピクセル型 | SynthID系 / Tree-Ring / CtrlRegen | ピクセル再生成 | Phase 3 |

### 🛡️ 敵対的検証・偽陽性防止保証 (Adversarial Quality Gates)
- **絵文字 ZWJ の完全保全**: 家族絵文字 (`👩‍👩‍👧‍👦`) や虹の旗 (`🏳️‍🌈`) などの ZWJ シーケンスを分解せず維持。
- **日本語 異体字セレクタ (IVS) の保全**: `葛󠄀`, `辻󠄀` などの `U+E0100-U+E01EF` を維持。
- **画像ピクセル完全性 (Lossless Guarantee)**: メタデータのみを除去し、ピクセルデータ（RGB/RGBA）は無傷で保全。
- **Zero-Retention プライバシー**: ファイル・文章はサーバーに永続保存せず、オンメモリ/即時破棄。
- **冪等性 (Idempotence)**: `f(f(x)) === f(x)` を保証。

---

## 🚀 クイックスタート (ローカル起動)

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 3. テストの実行
```bash
npm test
```

---

## 📡 API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/health` | サービス稼働ヘルスチェック |
| `GET` | `/api/capabilities` | 対応機能・スコープ・保護仕様一覧 |
| `POST` | `/api/inspect` | テキスト/ファイルの透かし・メタデータ事前検査 |
| `POST` | `/api/clean` | クレンジング実行 + Before/After 再検査レポート返却 |

### API リクエスト例 (テキスト)
```bash
curl -X POST http://localhost:3000/api/clean \
  -H "Content-Type: application/json" \
  -d '{"text": "AI生成\u200Bテキスト\uFEFFです。"}'
```

### API リクエスト例 (ファイル)
```bash
curl -X POST http://localhost:3000/api/clean \
  -F "file=@sample_image.png"
```

---

## 🐳 Docker 起動

```bash
docker build -t watermark-remover-mvp .
docker run -p 3000:3000 watermark-remover-mvp
```

---

## 📄 ライセンス

MIT License

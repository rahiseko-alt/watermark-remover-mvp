# Watermark Remover MVP (AI電子透かし・メタデータ除去 SaaS)

AI生成コンテンツ（テキスト・画像・文書）に含まれる機械可読情報・不可視透かしを高精度に検査し、ルールベースで決定論的に除去するプライバシー重視のSaaS MVPです。

OSS `guillaumemeyer/watermarks-remover` の設計思想に基づき、LLMやGPUに依存しない**Layer 1（メタデータ型）**および**Layer 2（不可視文字型）**のクレンジングを安全かつ高速に実行します。

---

## 🎯 対応範囲 & 仕様マトリクス

| 区分 | 主な対象 | 処理の性質 | MVP対応ステータス |
|---|---|---|---|
| **1. メタデータ型 (画像)** | EXIF, XMP, IPTC, PNG prompt chunks (tEXt/zTXt/iTXt) | 剥離・再構成 | **✓ 正式対応** (PNG/WebPは可逆保持、JPEGは高品質再エンコード) |
| **1. メタデータ型 (文書)** | DOCXプロパティ, コメント・変更履歴, PDF Info辞書, PDF XMP/JS | 剥離・サニタイズ | **✓ 正式対応** |
| **1. C2PA / Manifest** | C2PA / Content Credentials (JUMBF boxes) | 構造検知・剥離 | **△ 部分対応** (主要JUMBF/c2paボックスを除去。複雑な多重署名は実験的) |
| **2. 不可視文字型 (テキスト)** | ゼロ幅文字 (ZWSP/ZWNJ/ZWNBSP), Unicode Tags (U+E0000〜U+E007F), Bidi制御 | 除去・NFC正規化 | **✓ 正式対応** (ルールベース走査) |
| 3. 統計的テキスト透かし | トークン選択・文章パターン | LLMリライト | Phase 2 (未対応) |
| 4. 画像ピクセル型 | SynthID系 / Tree-Ring / CtrlRegen | ピクセル再生成 | Phase 3 (未対応) |

### 🛡️ 偽陽性防止・品質保証
- **絵文字 ZWJ の完全保全**: 家族絵文字 (`👩‍👩‍👧‍👦`) や虹の旗 (`🏳️‍🌈`) などの ZWJ シーケンスを分解せず維持。
- **日本語 異体字セレクタ (IVS) の保全**: `葛󠄀`, `辻󠄀` などの `U+E0100-U+E01EF` を維持。
- **PNG / WebP Lossless**: PNGおよびロスレスWebPではピクセルデータ（RGB/RGBA）を完全維持。
- **JPEGの仕様**: 高品質設定（quality: 98）で再エンコードしてメタデータを剥離します（JPEGの仕様上、ピクセルデータの完全一致は保証されません）。
- **クリーン時パススルー**: 対象情報が検出されなかった場合、元ファイル・文章を変更せずそのまま返却。
- **Zero-Retention プライバシー**: ファイル・文章はサーバーに永続保存せず、オンメモリ/即時破棄。

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

---

## 📄 ライセンス

MIT License

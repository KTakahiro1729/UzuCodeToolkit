# UzuCodeToolkit

[UZU Code](https://docs.code.uzu-app.com/)（ウズのコードモード）でマーダーミステリーを作るための部品とサンプルです。

- `packages/kit`: 読み合わせ（話者だけが自分の行を送る）と配役の部品。UI に依存しません。
- `samples/hundred-arms`: サンプル作品『百本腕と勇者』。2 人で台本を 1 行ずつ読み合わせます。

## 動かす

Node.js 22.12 以上が必要です。

```bash
npm ci
npm run harness   # 2 席を並べた dev harness（起動ログの URL を開く）
npm test
```

## ライセンス

- コード: [MIT](./LICENSE)
- サンプル台本『百本腕と勇者』の文章（`samples/hundred-arms/script/`）: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja)。詳細は [script/LICENSE.md](./samples/hundred-arms/script/LICENSE.md)
- 同梱フォント しっぽり明朝（`samples/hundred-arms/src/fonts/`）: [SIL Open Font License 1.1](./samples/hundred-arms/src/fonts/OFL.txt)

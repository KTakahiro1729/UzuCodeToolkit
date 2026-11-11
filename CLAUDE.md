# CLAUDE.md

UZU Code (`@uzuhq/code-sdk` の `run()`) でマーダーミステリーを作るための Toolkit。 参照: https://docs.code.uzu-app.com/

## 作成方針

- **過剰設計を避ける。** サンプル作品 (`samples/`) が使わないものは作らない (YAGNI)。 kit に足すのは、 サンプルで要るようになったときだけ。
- **文字に頼る UI は極小に。** 画面の文字は台本などの作品本文だけにし、 「〇〇の番です」のような説明文やヒントで状態を伝えない。
- **線を減らす。** 枠線・区切り線を使わず、 余白と背景色で区別する (例: 自分の番は行の背景を明るくする)。

## 構成 (npm workspaces)

| パス | 役割 |
|---|---|
| `packages/kit` | UI 非依存の部品。 読み合わせ (`advanceDialogue` ほか) と配役 (`assignRoles`)。 server の action と画面の両方から同じ関数を呼ぶ |
| `samples/hundred-arms` | サンプル作品『百本腕と勇者』。 2 人・横画面。 Svelte 5 |

## コマンド (リポジトリ直下から)

| 目的 | コマンド |
|---|---|
| 依存を入れる | `npm ci` (lockfile 無しの `npm install` は npm 10 で落ちることがあるので npm 11 を使う) |
| 単体テスト | `npm test` |
| 型 | `npm run typecheck` |
| dev harness (2 席を並べて動かす) | `npm run harness` → 起動ログの URL |

`npm run dev` (vite 単体) は SDK につながらない。 動作確認は harness で行う。 server のロジックを変えたら harness を再起動する。

## 書き方

- ロジックの actions はクライアントの先読みとサーバーの両方で走るので決定的に書く (乱数・実時刻を state に書かない)。 弾く操作は Error を投げる。
- 寸法は em (基準は画面の短辺に比例)。 Safe Area と UZU の HUD は `main.ts` が CSS 変数 (`--safe-*` / `--hud-y`) に流す。
- 認証要件 (https://docs.code.uzu-app.com/certification): `firstFrameReady()` 必須、 相対パス、 ファイル名は英数字と `_` `-` `.` のみ。

## ライセンス

- コード: MIT (`LICENSE`)
- 台本の文章 (`samples/hundred-arms/script/`): CC BY 4.0、 著作者 あろすてりっく (`script/LICENSE.md`)。 台本は一字一句変えない (`original.txt` と `script.json` の一致をテストが確かめる)
- 公式サンプル densetsu-no-tantei はライセンス表示が無いので、 コードを写さない

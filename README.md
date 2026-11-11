# UzuCodeToolkit

[UZU Code](https://docs.code.uzu-app.com/)（ウズのコードモード）でマーダーミステリーを作るための部品と最小構成です。

- `packages/kit`: UI に依存しない TypeScript の部品。server の action と画面の両方から同じ関数を呼び、「押せる見た目」と「実際に押せること」を一致させます。
- `templates/minimal`: `uzu dev` でそのまま動く最小の作品。2 人・横画面・進行管理席ありで、読み合わせを 1 場面だけ持ちます。
- `samples/hundred-arms`: サンプル作品『百本腕と勇者』。 2 人で台本を読み合わせます（`npm run sample`）。

## 動かす

Node.js 22.12 以上が必要です（[はじめに](https://docs.code.uzu-app.com/getting-started)）。

```bash
npm ci            # lockfile どおりに入れる
npm run harness   # 2 席 + 進行管理席を並べた dev harness (起動ログの URL を開く)
npm test          # kit とテンプレートの単体テスト
npm run typecheck
```

> [!NOTE]
> lockfile が無い状態で npm 10 の `npm install` を使うと、 依存解決が `Cannot read properties of null (reading 'edgesOut')` で落ちることがあります。 `npm ci` を使うか、 `npx npm@11 install` で入れてください。

`npm run dev`（vite 単体）は SDK につながらないので、動作確認は `npm run harness`（`uzu dev`）で行います（[開発・テストガイド](https://docs.code.uzu-app.com/guides/dev-tools)）。

## kit

### 読み合わせ (`@uzu-toolkit/kit/dialogue`)

台本を全員で声に出して読む時間の進行を受け持ちます。[マダミスの UX ガイド](https://docs.code.uzu-app.com/guides/murder-mystery) の読み合わせの指針をそのまま関数にしています。

| 関数 | 役割 |
|---|---|
| `startDialogue(scene)` | 共有 state に置く進み具合 (`DialogueProgress`) を作る |
| `readerRoleOf(scene, line, roleIds)` | その行を送る役。 役の台詞はその役、 NPC は `npcReaderRoleId`（無ければ地の文の担当）、 地の文は `narratorRoleId`。 送る人を 1 人に固定して空振りを防ぐ |
| `currentReader` / `nextReader` | いまの担当と次の担当。 次に読む人を先に見せて声の準備をさせる |
| `canAdvance` | その役がいま送れるか（ボタンの出し分け用） |
| `advanceDialogue(scene, progress, roleId, roleIds, expectedIndex?)` | 行送り。 担当以外・読み終えた後・古い行を見て押した二重タップは Error を投げる（SDK が state を巻き戻す） |
| `toggleSkip(progress, playerId, allPlayerIds)` | 全員の同意で読み飛ばす。 押し直すと取り消し |
| `readLines` | 読み返せる行。 先の行は見せない |
| `tapIntent({ fullyShown, isReader, finished })` | 1 回目のタップは全文表示（誰でも）、 2 回目は次へ（担当だけ） |

状態を変える関数は渡した `progress` を直接書き換えます。 SDK の action handler は live な state を書き換える形なので、 そのまま呼べます。

```ts
actions: {
  advance({ state, playerId, payload }) {
    advanceDialogue(OPENING, state.dialogue, state.roles[playerId], ROLE_IDS, payload.index);
  },
},
```

### 配役 (`@uzu-toolkit/kit/roles`)

| 関数 | 役割 |
|---|---|
| `assignRoles(seats, roleIds)` | 席 → 役。 キャラ選択の `characterId` を優先し、 未選択の席には残りの役を席順に割り当てる |
| `seatOfRole(roles, roleId)` | 役 → 席 |

## テンプレート (`templates/minimal`)

| ファイル | 中身 |
|---|---|
| `manifest.json` | 作品 ID・人数・横画面・進行管理席・キャラクター（[manifest リファレンス](https://docs.code.uzu-app.com/reference/manifest)） |
| `src/scenario.ts` | 台本と話者名。 役 ID は manifest の `characters[].id` と揃える |
| `src/logic.ts` | サーバー権威のロジック（`serverActionLogicPath`） |
| `src/main.ts` | `run()` の呼び出し、 `firstFrameReady()` / `gameReady()`、 Safe Area と HUD の inset を CSS 変数へ |
| `src/components/` | Svelte の画面。 `DialogueView.svelte` が読み合わせ |

新しい作品を始めるときは `templates/minimal` を複製し、 `manifest.json` の `id` を自分の作品のものに変えてください（同じ `id` で publish すると同じ作品の新リビジョンになります）。

## サンプル『百本腕と勇者』 (`samples/hundred-arms`)

勇者 (勇) と百本の腕を持つ魔物 (百) の掛け合いを、 2 人で 1 行ずつ声に出して読みます。

```bash
npm run sample   # 2 席 + 進行管理席の dev harness
```

台本の原文は `script/original.txt`、 部品が読む形は `script/script.json` です。 テストで両者が一字一句同じことを確かめています。

## ライセンス

- コード（`packages/`・`templates/`・`samples/` の画面・ロジック・設定）: [MIT](./LICENSE)
- サンプル台本『百本腕と勇者』の文章（`samples/hundred-arms/script/`）: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja)。 詳細は [script/LICENSE.md](./samples/hundred-arms/script/LICENSE.md)

公式サンプル [densetsu-no-tantei](https://github.com/uzu-scenarios/densetsu-no-tantei) にはライセンスの表示が無いため、 コードは写さず、 公開ドキュメントと MIT ライセンスの `@uzuhq/code-sdk` / `@uzuhq/code-cli` の型定義を元に書き起こしています。

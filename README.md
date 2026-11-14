# UzuCodeToolkit

Building blocks and samples for making games with [UZU Code](https://docs.code.uzu-app.com/), aimed at murder mysteries. The way to use it: give an AI agent (ChatGPT first) the release URL of `@uzu-toolkit/toolkit` and a script, and it builds the work; read-throughs first, more phases later. The package carries the rules, docs, tools and a starting template (`packages/toolkit/README.md` is where the agent starts). Each author owns the licence of their own work; the toolkit's code is MIT.

- `packages/kit`: read-through (each line's reader advances it), casting (one player can read several roles) and ruby. UI independent.
- `packages/reader`: the read-through screens and server logic the samples share.
- Sample works, read aloud one line at a time: `samples/hundred-arms` 百本腕と勇者 (two players), `samples/yubiwa` 指環 by 江戸川乱歩 (two players), `samples/mittsu-no-takara` 三つの宝 by 芥川龍之介 (three players).

## Run

Requires Node.js 22.12 or later.

```bash
npm ci
npm run harness   # 百本腕と勇者 in the dev harness (open the URL in the log)
(cd samples/mittsu-no-takara && npm run harness)   # another work
npm test
```

## License

- Code: [MIT](./LICENSE)
- Script text of 百本腕と勇者 (`samples/hundred-arms/script/`): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See [script/LICENSE.md](./samples/hundred-arms/script/LICENSE.md)
- Text of 指環 and 三つの宝 (`samples/yubiwa/script/`, `samples/mittsu-no-takara/script/`): public domain in Japan, from [Aozora Bunko](https://www.aozora.gr.jp/). See each `script/LICENSE.md`
- Bundled fonts (`samples/*/src/fonts/`), SIL Open Font License 1.1: Shippori Mincho ([OFL](./samples/hundred-arms/src/fonts/OFL-ShipporiMincho.txt)), BIZ UDPGothic ([OFL](./samples/hundred-arms/src/fonts/OFL-BIZUDPGothic.txt))

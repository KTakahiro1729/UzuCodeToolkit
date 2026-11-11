# UzuCodeToolkit

Building blocks and a sample for making murder-mystery games with [UZU Code](https://docs.code.uzu-app.com/).

- `packages/kit`: read-through (each line's speaker advances it) and role assignment. UI independent.
- `samples/hundred-arms`: the sample work 百本腕と勇者. Two players read the script aloud, one line at a time.

## Run

Requires Node.js 22.12 or later.

```bash
npm ci
npm run harness   # dev harness with two seats (open the URL in the log)
npm test
```

## License

- Code: [MIT](./LICENSE)
- Script text of 百本腕と勇者 (`samples/hundred-arms/script/`): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See [script/LICENSE.md](./samples/hundred-arms/script/LICENSE.md)
- Bundled font Shippori Mincho (`samples/hundred-arms/src/fonts/`): [SIL Open Font License 1.1](./samples/hundred-arms/src/fonts/OFL.txt)

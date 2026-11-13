# Styles read the SDK's safe-area and HUD variables directly

The SDK already sets `--uzu-safe-area-inset-{top,right,bottom,left}` and `--uzu-hud-inset-x/y` before the first paint and keeps them current on rotation and picture-in-picture (https://docs.code.uzu-app.com/guides/safe-area). The toolkit used to copy them into `--safe-*` and `--hud-x/y`; those copies are gone and every style reads the SDK's names.

Why: one source of truth, and no copy that can drift from the SDK's.

What stays: `applyInsets` in `packages/reader/src/index.ts` sets only what the SDK does not know, `--band-top` and `data-band-row`, since they depend on the HUD's share of the width. It still runs on `onInsetsChange` and on `resize` (a changed width changes that share).

Not taken: `--uzu-content-inset-*`. Its top value adds the HUD height, but the band needs the safe area and the HUD separately (the band shares the HUD's row on wide screens).

Checked: the overflow check passes and the captured screens are pixel-identical to before at 780×360, 844×390, 1194×834 and 874×402, both orientations.

# Design policy

The source of truth for how screens in this repository look. The owner's words are quoted verbatim; the notes under each quote say how they apply. Concrete values chosen for the sample (colours, file names) are in [decisions.md](decisions.md).

When the owner gives a new design instruction, add it here as a quote with its note.

## Scope

> 過剰設計をさける。具体的にはサンプルプロジェクトに不要なものはYAGNIと考える

Build only what `samples/` uses. Add to the kit when the sample needs it.

## Text

> 文字に頼るUIは極小に

Screen text is the work's own text (the script). Do not explain state with sentences or hints.

## Lines

> 余白や背景色を利用し、線が多すぎるUIは減らす

No borders or rules; separate things with spacing and background colour.

## Colour

> カラーリングはもっとクセをなくして
>
> なんかグラデがかかって見づらい

Neutral colours with no tint; no gradients or fades.

## Cards

> カード型デザインを過信しないで。変に余白食うだけのことあるし

Do not reach for cards by default. A box with padding costs room, most of all on a phone; use a background only where it carries meaning, and keep its padding tight.

## Motion

> カクカクにならないような最小限のアニメーションを入れて

Use only the motion needed so changes on screen do not jump.

## Read-through screen

> どちらかというとチャット画面風にして
>
> アイコンはある前提で

Lines appear as chat bubbles with the speaker's icon. Assume every role has an icon.

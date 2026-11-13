# The footer's main button takes eight full-width characters

A work's plan names its buttons (InterstellarBG: 「このゲームで遊ぶ」, 8 characters), and a player looks for the button the guide names. So the main button is 8.4em wide instead of 7.4em and `MAX_BUTTON_TEXT` is 8. Not taken: shortening the plan's wording, or letting the label wrap (the button's height is fixed).

Shows in `FooterActions.svelte` (width), `fit.ts` (`MAX_BUTTON_TEXT`) and `docs/design/chrome.md`.

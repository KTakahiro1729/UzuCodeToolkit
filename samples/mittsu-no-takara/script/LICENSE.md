# Script source

The text of 三つの宝 in this folder (`samples/mittsu-no-takara/script/`) is in the public domain in Japan: the author, 芥川龍之介, died in 1927.

The text comes from Aozora Bunko (青空文庫), card 1126: https://www.aozora.gr.jp/cards/000879/card1126.html

- Title: 三つの宝 (first published in 「良婦之友」, February 1922)
- Author: 芥川龍之介
- Base text (底本): 「芥川龍之介全集5」ちくま文庫、筑摩書房 (1987)
- Input: j.utiyama. Proofreading: 多羅尾伴内. Aozora Bunko file made 2004-01-05, revised 2010-11-04.

Code outside this folder is MIT, per the repository [LICENSE](../../../LICENSE).

| File | Content |
|---|---|
| `original.txt` | The Aozora Bunko text file (`mittsuno_takara.txt` in `1126_ruby_14122.zip`), converted from Shift_JIS to UTF-8 with LF line ends, otherwise unchanged, including its notes on the base text |
| `script.json` | The same text in the shape the read-through code reads, wording unchanged. Ruby stays in Aozora notation (`漢字《かんじ》`, `｜` marks where a ruby starts). The one character Aozora writes as a note, `※［＃疑問符感嘆符、1-8-77］`, is stored as ⁉ |

## How script.json maps the play

- Stage directions are lines spoken by the `togaki` role (ト書き), so a player reads them aloud like any other line.
- `label` keeps the name the text uses when it shortens a role's name (主人 for 宿屋の主人, 王 for 黒ん坊の王).
- A line with two speakers (第一の盗人と第三の盗人) lists both; the first reads it.
- `scene` marks the first line of each scene (一, 二, 三).
- `cont` marks the block in scene 三 that the text sets as stage-direction indentation but that continues 王女's speech (it ends in 「……」 and speaks in her voice); it is read by her and shown without a new speaker name.
- `end` holds the closing date (（大正十一年十二月）).
- `parts` are the three seats (the manifest characters). One player can voice several roles: 王子 alone; 王女 with 第一・第三の盗人, 宿屋の主人 and ト書き; 黒ん坊の王 with 第二の盗人, 第一・第二の農夫 and 一同. The split keeps the read text roughly even (about 2,400, 2,400 and 1,900 characters).

## Notes on the wording

- The text uses 「黒ん坊」, a term now regarded as discriminatory. It is kept as written, because the script reproduces the public-domain text unchanged. The sample shows a note about this before the read-through starts.
- 「干里」 in scene 二 (第一の農夫's line) is very likely a misprint for 「千里」. It is kept as the Aozora Bunko text has it.

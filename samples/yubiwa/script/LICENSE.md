# Script source

The text of 指環 in this folder (`samples/yubiwa/script/`) is in the public domain in Japan: the author, 江戸川乱歩, died on 1965-07-28, and the term of 50 years after death ended before the 2018 extension to 70 years, which does not revive expired works.

The text comes from Aozora Bunko (青空文庫), card 57197: https://www.aozora.gr.jp/cards/001779/card57197.html

- Title: 指環 (first published in 「新青年」, 博文館, July 1925, as 「小品二篇　その二　指環」)
- Author: 江戸川乱歩
- Base text (底本): 「江戸川乱歩全集　第1巻　屋根裏の散歩者」光文社文庫、光文社 (2004)
- Input: 門田裕志. Proofreading: A.K. Aozora Bunko file made 2016-03-04.

Code outside this folder is MIT, per the repository [LICENSE](../../../LICENSE).

| File | Content |
|---|---|
| `original.txt` | The Aozora Bunko text file (`yubiwa.txt` in `57197_ruby_58710.zip`), converted from Shift_JIS to UTF-8 with LF line ends, otherwise unchanged, including its notes on the base text |
| `script.json` | The same lines in the shape the read-through code reads, wording unchanged. Ruby stays in Aozora notation (`漢字《かんじ》`, `｜` marks where a ruby starts) |

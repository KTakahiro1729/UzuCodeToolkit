# Works follow the toolkit by an automatic submodule update, not by hand

Superseded in part by 2026-11-13-the-change-notice-is-the-pull-request-description.md (the CHANGELOG).

A work that takes the toolkit as a submodule gets a scheduled workflow that moves the pin to the toolkit's main and opens one pull request; it rebuilds the work's font subsets when the glyph check fails. The toolkit keeps `CHANGELOG.md` in which every entry ends with `Work action:` (`none` or the step), and the update's pull request quotes the new entries so the work's owner sees at a glance whether anything is to be done. A change to a part's props, a string key, a data format, a command or the fonts needs an entry in the same toolkit pull request.

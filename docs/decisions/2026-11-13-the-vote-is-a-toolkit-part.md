# The vote is a toolkit part

Word wolf's vote moved from InterstellarBG, as an important part for other works (a culprit vote). The kit keeps a ballot in state (`ballot`, `castVote`, `ballotClosed`): one choice per voter, changeable until the last voter votes, no vote for yourself unless allowed. The reader's `Vote` shows the choices and how many have not voted. What a result means (a tie, a reversal) stays with the game.

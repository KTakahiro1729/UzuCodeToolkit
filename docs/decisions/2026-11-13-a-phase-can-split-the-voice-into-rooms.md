# A phase can split the voice into rooms

A work may need who can hear whom to follow the game (a map walk where only people in the same place hear each other). The platform already assigns each player a voice room from the game state (`voicePlan`), so `flowLogic` passes the call to the current phase's optional `voicePlan({ state, seat, part, parts })`; a phase without one keeps everyone in the whole-game room. The function must be pure and light, as the SDK asks. The toolkit adds no screen for it: what the players should know about who hears them is the work's to say.

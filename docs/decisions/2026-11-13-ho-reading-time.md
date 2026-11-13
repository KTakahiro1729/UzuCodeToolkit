# HO reading time

A timer shows the time left (the work sets it; 5 minutes in InterstellarBG). When it runs out the phase ends, done or not; settings left blank stay empty. Before that, any player still reading can ask for more time, which adds 2 minutes for everyone. After it ran out, the next screen keeps that button until anyone acts there; it brings everyone back to the handout with 2 minutes from then. Going back is a general phase feature (`reopen`): the next phase's state is dropped and set up again. Time is the SDK's game time, so actions stay deterministic.

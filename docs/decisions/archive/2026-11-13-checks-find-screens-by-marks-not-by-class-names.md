# Checks find screens by marks, not by class names

The dev harness's tap-next and the screen preview's `next` and `scroll` look for `data-uzu-actions="main"`, `data-uzu-phase` and `data-uzu-scroll`, so they keep working when a work replaces the screens; the harness says so when it finds no main action.

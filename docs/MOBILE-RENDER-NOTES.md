# ZenBlog — Mobile render notes

## Why this document exists

Mobile rendering failed for reasons that were not visible from desktop-only review. These are now architectural invariants, not one-off CSS patches.

## Root causes found

1. **Header height was treated as a fixed 101 px on mobile.**
   With `viewport-fit=cover`, iPhone can expose a non-zero `safe-area-inset-top`. The real two-row header becomes taller, while Home still subtracted only 101 px. Result: Home could clip or compress content.

2. **Home reserved a fixed viewport box while small phones had insufficient usable height.**
   The page must account for header + player + mobile browser chrome. Short phones now compact typography and spacing before using emergency internal scrolling.

3. **About switched to one column at 500 px.**
   That breakpoint affected almost every phone and made the profile unnecessarily tall. Portrait and identity now remain side-by-side on normal phones; stacking is reserved for genuinely narrow screens (<=340 px).

4. **About CSS was loaded only after entering the route.**
   This produced a visible layout/style transition. The stylesheet is now declared in the Blogger `<head>` with `id="zen-about-css"`; the feature bootstrap reuses it instead of duplicating it.

5. **Theme assets could point to an older immutable SHA than the source branch.**
   A correct source file is irrelevant if Blogger continues loading old CSS. Release XML must always pin every public asset to the exact tested asset commit.

## Mobile invariants

- `--zen-header-h` must include the real top safe area.
- `--zen-player-safe` must include bottom safe area.
- Home uses the remaining viewport after header and player.
- 360×640 / SE-class heights are first-class QA cases.
- About stays two-column on ordinary phones.
- No horizontal document scroll.
- All touch targets remain usable; compacting must not remove functions.
- Visible navigation remains available even when swipe navigation is enabled.
- Only extreme short viewports may use Home's emergency internal scroll.

## Required QA widths/heights

- 320×568
- 360×640
- 375×667
- 390×844
- 393×852
- 430×932
- 768×1024
- Desktop >= 1180 px

Test both Home and About at each relevant phone size, with a notched iPhone safe area in the real-device pass.

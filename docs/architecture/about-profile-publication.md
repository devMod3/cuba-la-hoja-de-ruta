# About profile publication contract

## Purpose

ZenBlog About has two intentionally different persistence contexts:

1. local Admin draft;
2. public Blogger profile.

They must never be treated as the same browser storage.

## Local Admin draft

`AboutManager` writes through `SiteProfileStore`.

Default storage key:

`zenSiteProfile.v1`

Default browser storage:

`localStorage`

This state exists only for the current browser origin. It is appropriate for local editing and same-origin preview, but it is not a publication mechanism.

## Published public profile

Canonical runtime artifact:

`config/site-profile.public.json`

Public Blogger About reads this artifact through `PublishedSiteProfileStore` when the document origin differs from the GitHub Pages module origin.

The published store:

- is read-only at runtime;
- validates the same v1 site-profile contract as Admin;
- fetches without browser credentials;
- does not subscribe to localStorage events;
- becomes effective on page load/release identity.

## Source selection

The decision is origin-based, not device-based:

- page origin == module origin -> local `SiteProfileStore`;
- page origin != module origin -> `PublishedSiteProfileStore`.

This keeps local Admin preview immediate while preventing Blogger from accidentally depending on another origin's localStorage.

## Publication workflow

Admin remains the authoring surface and source of profile values.

To publish a changed profile:

1. Save the profile in Admin and verify the local public preview.
2. Use Admin `Exportar` to generate the v1 profile JSON.
3. Replace `config/site-profile.public.json` with that exported profile payload as part of the release/change set.
4. Run unit and browser contracts.
5. Publish the accepted payload through the normal ZenBlog release process.

`exportedAt` or other export-only fields are ignored by canonicalization; public runtime consumes only the v1 site-profile contract.

## Failure behavior

If the published snapshot cannot be fetched or fails validation, public About must not fall back to browser-local profile data. It uses the public fallback path instead.

This prevents stale or device-specific private Admin state from becoming public by accident.

## Security boundary

Do not place GitHub tokens, Blogger credentials, or other publishing credentials in About/Admin browser code.

A future automated publisher, if added, must live behind an authenticated local/server-side boundary and produce the same `config/site-profile.public.json` artifact. The public reader contract should not change.

## Maintenance rules

- `SiteProfileStore` owns mutable local draft persistence.
- `PublishedSiteProfileStore` owns immutable public snapshot consumption.
- `AboutFeature` only renders the store interface it receives.
- Public Blogger About must never use `localStorage` as authoritative content storage.
- Do not duplicate configured profile values inside `AboutFeature` as a substitute for publication.
- Historical/test profile snapshots belong in fixtures, not runtime ownership.

## Automated contracts

`tests/about-public-profile-store.test.js`

Validates origin selection, credential-free fetch, snapshot validation and the checked-in public artifact.

`tests/about-public-profile-browser.mjs`

Runs a two-origin browser scenario. The simulated Blogger origin deliberately contains a conflicting `zenSiteProfile.v1` localStorage value, while the simulated GitHub Pages origin serves a published snapshot. The test passes only when rendered `#zen-about` uses the published snapshot and ignores the conflicting local profile.

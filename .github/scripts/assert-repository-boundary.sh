#!/usr/bin/env bash
set -euo pipefail

mapfile -t roots < <(find . -mindepth 1 -maxdepth 1 ! -name .git -printf '%f\n' | sort)
expected=(.github README.md next)

if [[ "${roots[*]}" != "${expected[*]}" ]]; then
  printf 'Repository boundary violation.\nExpected root: %s\nActual root:   %s\n' \
    "${expected[*]}" "${roots[*]}" >&2
  exit 1
fi

required=(
  next/package.json
  next/apps/web/app/sitemap.ts
  next/packages/site-config/src/index.ts
  next/packages/content-catalog/src/index.ts
  next/packages/domain/src/schema.ts
  next/docs/ADR-006-50-YEAR-PORTABLE-CORE.md
  .github/workflows/ci.yml
  .github/workflows/deploy-pages.yml
  .github/workflows/pages-stale-guard.yml
  .github/scripts/assert-repository-boundary.sh
)

for path in "${required[@]}"; do
  if [[ ! -f "$path" ]]; then
    echo "Required repository boundary file missing: $path" >&2
    exit 1
  fi
done

for forbidden in tools src config docs .specify .nojekyll; do
  if [[ -e "$forbidden" ]]; then
    echo "Forbidden root path present: $forbidden" >&2
    exit 1
  fi
done

if find . -maxdepth 1 -name '.pages-refactor-payload*' -print -quit | grep -q .; then
  echo 'Temporary Pages refactor payload found at repository root.' >&2
  exit 1
fi

if find .github/workflows -type f \( -name '*blogger*' -o -name '*export*' -o -name '*fix-r3b*' -o -name '*split-migration*' \) -print -quit | grep -q .; then
  echo 'Temporary or legacy workflow detected.' >&2
  exit 1
fi

if find next -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.jsx' \) -print -quit | grep -q .; then
  echo 'Maintained JavaScript/JSX source detected under next/.' >&2
  exit 1
fi

echo 'PAGES_REPOSITORY_BOUNDARY=PASS'

const PARTS = [
  'search-core-v1.part1.txt',
  'search-core-v1.part2.txt',
  'search-core-v1.part3.txt',
  'search-core-v1.part4.txt'
];

let corePromise = null;

export function loadZenSearchCore() {
  if (corePromise) return corePromise;

  corePromise = Promise.all(
    PARTS.map(async (part) => {
      const response = await fetch(new URL(`./${part}`, import.meta.url));
      if (!response.ok) throw new Error(`Zen Search Core HTTP ${response.status}`);
      return response.text();
    })
  ).then(async (parts) => {
    const source = parts.join('');
    const blobUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    try {
      return await import(blobUrl);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  });

  return corePromise;
}

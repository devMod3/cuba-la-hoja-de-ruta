const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_PROFILE_PHOTO_DATA_URL_LENGTH = 880_000;
const PHOTO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener(
      'error',
      () => {
        reject(new Error('No se pudo leer la imagen.'));
      },
      { once: true }
    );
    reader.addEventListener(
      'load',
      () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('No se pudo leer la imagen.'));
      },
      { once: true }
    );
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string, anonymous = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (anonymous) image.crossOrigin = 'anonymous';
    image.addEventListener(
      'load',
      () => {
        resolve(image);
      },
      { once: true }
    );
    image.addEventListener(
      'error',
      () => {
        reject(new Error('Formato de imagen no compatible.'));
      },
      { once: true }
    );
    image.src = source;
  });
}

function cropSquare(
  image: HTMLImageElement,
  size: number,
  quality: number,
  format: 'image/webp' | 'image/png'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('El navegador no pudo preparar la imagen.');

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const sourceSize = Math.min(width, height);
  context.fillStyle = '#121416';
  context.fillRect(0, 0, size, size);
  context.drawImage(
    image,
    (width - sourceSize) / 2,
    (height - sourceSize) / 2,
    sourceSize,
    sourceSize,
    0,
    0,
    size,
    size
  );

  const value = canvas.toDataURL(format, quality);
  if (format === 'image/webp' && !value.startsWith('data:image/webp')) {
    return canvas.toDataURL('image/jpeg', quality);
  }
  return value;
}

export async function normalizeProfilePhoto(file: File): Promise<string> {
  if (!PHOTO_TYPES.has(file.type)) throw new Error('La foto debe ser PNG, JPEG o WebP.');
  if (file.size > MAX_PHOTO_BYTES) throw new Error('La imagen supera 10 MB.');

  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  let data = cropSquare(image, 512, 0.84, 'image/webp');
  if (data.length > 780_000) data = cropSquare(image, 384, 0.78, 'image/webp');
  if (data.length > MAX_PROFILE_PHOTO_DATA_URL_LENGTH) {
    throw new Error('La imagen sigue siendo demasiado grande después de optimizarla.');
  }
  return data;
}

export async function createProfileFavicon(source: string): Promise<string> {
  const normalized = source.trim();
  if (!normalized) throw new Error('Primero añade una foto de perfil.');
  const image = await loadImage(normalized, /^https?:/iu.test(normalized));
  return cropSquare(image, 96, 0.92, 'image/png');
}

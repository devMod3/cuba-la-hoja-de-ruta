const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/webm'
]);

const MAX_AUDIO_BYTES = 1_500_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('No se pudo leer el Audio Clip.'));
          return;
        }
        resolve(reader.result);
      },
      { once: true }
    );
    reader.addEventListener(
      'error',
      () => {
        reject(new Error('No se pudo leer el Audio Clip.'));
      },
      { once: true }
    );
    reader.readAsDataURL(file);
  });
}

export async function readProfileAudio(file: File): Promise<string> {
  if (!ALLOWED_AUDIO_TYPES.has(file.type)) {
    throw new Error('El Audio Clip debe ser MP3, M4A/MP4, OGG, WAV o WebM.');
  }
  if (file.size <= 0) throw new Error('El Audio Clip está vacío.');
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error('El Audio Clip supera el máximo de 1,5 MB.');
  }
  return readAsDataUrl(file);
}

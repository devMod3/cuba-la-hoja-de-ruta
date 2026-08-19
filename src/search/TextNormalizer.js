export class TextNormalizer {
  normalize(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es')
      .replace(/[-_/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

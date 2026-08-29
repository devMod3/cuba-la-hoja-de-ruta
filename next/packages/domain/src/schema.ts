export interface ParseSuccess<T> {
  readonly success: true;
  readonly data: T;
}

export interface ParseFailure {
  readonly success: false;
  readonly error: Error;
}

export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export interface DomainSchema<T> {
  parse(value: unknown): T;
  safeParse(value: unknown): ParseResult<T>;
}

export function createDomainSchema<T>(parser: (value: unknown) => T): DomainSchema<T> {
  return Object.freeze({
    parse: parser,
    safeParse(value: unknown): ParseResult<T> {
      try {
        return Object.freeze({ success: true as const, data: parser(value) });
      } catch (error) {
        return Object.freeze({
          success: false as const,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }
  });
}

export function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function requiredText(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${context} must be a non-empty string`);
  }
  return value.trim();
}

export function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function nullableText(value: unknown, context: string): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') throw new Error(`${context} must be a string or null`);
  return value;
}

export function textArray(value: unknown, context: string): readonly string[] {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) throw new Error(`${context} must be an array`);
  const output = value.map((item, index) => {
    if (typeof item !== 'string') throw new Error(`${context}[${String(index)}] must be a string`);
    return item;
  });
  return Object.freeze(output);
}

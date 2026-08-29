import { describe, expect, it } from 'vitest';
import { MetadataRegistrySchema } from './src';
import {
  asRecord,
  createDomainSchema,
  nullableText,
  requiredText,
  text,
  textArray
} from './src/schema';

describe('MetadataRegistrySchema', () => {
  it('normalizes non-positive document years to null and preserves positive years', () => {
    const positive = MetadataRegistrySchema.parse({
      records: {
        positive: {
          temporal: { documentYear: 1940 }
        }
      }
    });
    const zero = MetadataRegistrySchema.parse({
      records: {
        zero: {
          temporal: { documentYear: 0 }
        }
      }
    });
    const negative = MetadataRegistrySchema.parse({
      records: {
        negative: {
          temporal: { documentYear: -1 }
        }
      }
    });

    expect(positive.records['positive']?.temporal.documentYear).toBe(1940);
    expect(zero.records['zero']?.temporal.documentYear).toBeNull();
    expect(negative.records['negative']?.temporal.documentYear).toBeNull();
  });

  it('fails closed for malformed present values while preserving optional defaults', () => {
    const empty = MetadataRegistrySchema.parse({ records: { empty: {} } });
    expect(empty.records['empty']).toEqual({
      classification: { primaryPillar: null, relatedPillars: [], type: null },
      temporal: { documentYear: null },
      indexing: { concepts: [], aliases: [], keywords: [], norms: [] },
      editorial: { status: null }
    });

    for (const malformed of [
      null,
      {},
      { records: [] },
      { records: { broken: null } },
      { records: { broken: { classification: { primaryPillar: 1940 } } } },
      { records: { broken: { indexing: { norms: [{ articles: [{}] }] } } } },
      { records: { broken: { temporal: { documentYear: false } } } },
      { records: { broken: { temporal: { documentYear: 1940.5 } } } }
    ]) {
      expect(MetadataRegistrySchema.safeParse(malformed).success).toBe(false);
    }
  });
});

describe('domain schema primitives', () => {
  it('normalizes safe text values and rejects malformed structural values', () => {
    expect(requiredText('  value  ', 'field')).toBe('value');
    expect(text(42)).toBe('');
    expect(nullableText(undefined, 'field')).toBeNull();
    expect(nullableText('', 'field')).toBeNull();
    expect(nullableText('value', 'field')).toBe('value');
    expect(textArray(undefined, 'field')).toEqual([]);
    expect(textArray(['a', 'b'], 'field')).toEqual(['a', 'b']);

    expect(() => asRecord([], 'field')).toThrow(/must be an object/u);
    expect(() => nullableText(42, 'field')).toThrow(/string or null/u);
    expect(() => textArray('bad', 'field')).toThrow(/must be an array/u);
    expect(() => textArray(['ok', 42], 'field')).toThrow(/field\[1\]/u);
  });

  it('converts non-Error parser failures into stable Error results', () => {
    const primitiveThrower = (function* () {
      yield undefined;
    })();
    primitiveThrower.next();
    const schema = createDomainSchema(() => primitiveThrower.throw('parser sentinel'));
    const result = schema.safeParse(null);

    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected parse failure');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('parser sentinel');
  });
});

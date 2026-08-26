import { describe, expect, it } from 'vitest';
import { MetadataRegistrySchema } from './src';

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

    expect(positive.records.positive?.temporal.documentYear).toBe(1940);
    expect(zero.records.zero?.temporal.documentYear).toBeNull();
    expect(negative.records.negative?.temporal.documentYear).toBeNull();
  });
});

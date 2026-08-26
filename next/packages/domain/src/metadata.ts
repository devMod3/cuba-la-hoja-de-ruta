import { z } from 'zod';

const StringOrNumberSchema = z.union([z.string(), z.number()]).transform(String);

const DocumentYearSchema = z.preprocess((value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}, z.number().int().positive().nullable());

export const MetadataClassificationSchema = z
  .object({
    primaryPillar: z.string().nullable().default(null),
    relatedPillars: z.array(z.string()).default([]),
    type: z.string().nullable().default(null)
  })
  .loose();

export const MetadataNormReferenceSchema = z
  .object({
    normId: z.string().default(''),
    articles: z.array(StringOrNumberSchema).default([])
  })
  .loose();

export const MetadataIndexingSchema = z
  .object({
    concepts: z.array(z.string()).default([]),
    aliases: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    norms: z.array(MetadataNormReferenceSchema).default([])
  })
  .loose();

export const MetadataEditorialSchema = z
  .object({
    status: z.string().nullable().default(null)
  })
  .loose();

export const MetadataRecordSchema = z
  .object({
    classification: MetadataClassificationSchema.default({
      primaryPillar: null,
      relatedPillars: [],
      type: null
    }),
    temporal: z
      .object({
        documentYear: DocumentYearSchema
      })
      .loose()
      .default({ documentYear: null }),
    indexing: MetadataIndexingSchema.default({
      concepts: [],
      aliases: [],
      keywords: [],
      norms: []
    }),
    editorial: MetadataEditorialSchema.default({ status: null })
  })
  .loose()
  .readonly();

export const MetadataRegistrySchema = z
  .object({
    records: z.record(z.string(), MetadataRecordSchema).default({})
  })
  .loose()
  .readonly();

export type MetadataRecord = z.infer<typeof MetadataRecordSchema>;
export type MetadataRegistry = z.infer<typeof MetadataRegistrySchema>;

import { z } from 'zod';

export const MetadataRecordSchema = z.object({
  classification: z.object({
    primaryPillar: z.string().nullable(),
    relatedPillars: z.array(z.string()).default([]),
    type: z.string().nullable()
  }),
  temporal: z.object({ documentYear: z.number().int().positive().nullable() })
}).readonly();

export type MetadataRecord = z.infer<typeof MetadataRecordSchema>;

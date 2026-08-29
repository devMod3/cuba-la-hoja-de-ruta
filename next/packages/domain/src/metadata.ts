import { asRecord, createDomainSchema } from './schema';

export interface MetadataClassification {
  readonly primaryPillar: string | null;
  readonly relatedPillars: readonly string[];
  readonly type: string | null;
}

export interface MetadataNormReference {
  readonly normId: string;
  readonly articles: readonly string[];
}

export interface MetadataIndexing {
  readonly concepts: readonly string[];
  readonly aliases: readonly string[];
  readonly keywords: readonly string[];
  readonly norms: readonly MetadataNormReference[];
}

export interface MetadataEditorial {
  readonly status: string | null;
}

export interface MetadataRecord {
  readonly classification: MetadataClassification;
  readonly temporal: Readonly<{ documentYear: number | null }>;
  readonly indexing: MetadataIndexing;
  readonly editorial: MetadataEditorial;
}

export interface MetadataRegistry {
  readonly records: Readonly<Record<string, MetadataRecord>>;
}

function optionalRecord(value: unknown, context: string): Record<string, unknown> {
  if (value === undefined) return {};
  return asRecord(value, context);
}

function nullableString(value: unknown, context: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error(`${context} must be a string or null`);
  return value;
}

function stringArray(value: unknown, context: string): readonly string[] {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) throw new Error(`${context} must be an array`);
  return Object.freeze(
    value.map((item, index) => {
      if (typeof item !== 'string') {
        throw new Error(`${context}[${String(index)}] must be a string`);
      }
      return item;
    })
  );
}

function stringOrNumberArray(value: unknown, context: string): readonly string[] {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) throw new Error(`${context} must be an array`);
  return Object.freeze(
    value.map((item, index) => {
      if (typeof item !== 'string' && typeof item !== 'number') {
        throw new Error(`${context}[${String(index)}] must be a string or number`);
      }
      return String(item);
    })
  );
}

function parseClassification(value: unknown): MetadataClassification {
  const record = optionalRecord(value, 'MetadataRecord.classification');
  return Object.freeze({
    primaryPillar: nullableString(
      record['primaryPillar'],
      'MetadataRecord.classification.primaryPillar'
    ),
    relatedPillars: stringArray(
      record['relatedPillars'],
      'MetadataRecord.classification.relatedPillars'
    ),
    type: nullableString(record['type'], 'MetadataRecord.classification.type')
  });
}

function parseNormReference(
  value: unknown,
  context = 'MetadataNormReference'
): MetadataNormReference {
  const record = asRecord(value, context);
  const normId = record['normId'];
  if (normId !== undefined && typeof normId !== 'string') {
    throw new Error(`${context}.normId must be a string`);
  }
  return Object.freeze({
    normId: normId ?? '',
    articles: stringOrNumberArray(record['articles'], `${context}.articles`)
  });
}

function parseIndexing(value: unknown): MetadataIndexing {
  const record = optionalRecord(value, 'MetadataRecord.indexing');
  const normsInput = record['norms'];
  if (normsInput !== undefined && !Array.isArray(normsInput)) {
    throw new Error('MetadataRecord.indexing.norms must be an array');
  }
  const norms = (normsInput ?? []).map((item, index) =>
    parseNormReference(item, `MetadataRecord.indexing.norms[${String(index)}]`)
  );
  return Object.freeze({
    concepts: stringArray(record['concepts'], 'MetadataRecord.indexing.concepts'),
    aliases: stringArray(record['aliases'], 'MetadataRecord.indexing.aliases'),
    keywords: stringArray(record['keywords'], 'MetadataRecord.indexing.keywords'),
    norms: Object.freeze(norms)
  });
}

function parseEditorial(value: unknown): MetadataEditorial {
  const record = optionalRecord(value, 'MetadataRecord.editorial');
  return Object.freeze({
    status: nullableString(record['status'], 'MetadataRecord.editorial.status')
  });
}

function documentYear(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('MetadataRecord.temporal.documentYear must be a string, number, or null');
  }
  if (typeof value === 'number' && !Number.isInteger(value)) {
    throw new Error('MetadataRecord.temporal.documentYear must be an integer');
  }
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

function parseMetadataRecord(value: unknown): MetadataRecord {
  const record = asRecord(value, 'MetadataRecord');
  const temporal = optionalRecord(record['temporal'], 'MetadataRecord.temporal');
  return Object.freeze({
    classification: parseClassification(record['classification']),
    temporal: Object.freeze({ documentYear: documentYear(temporal['documentYear']) }),
    indexing: parseIndexing(record['indexing']),
    editorial: parseEditorial(record['editorial'])
  });
}

function parseMetadataRegistry(value: unknown): MetadataRegistry {
  const root = asRecord(value, 'MetadataRegistry');
  const recordsInput = asRecord(root['records'], 'MetadataRegistry.records');
  const records: Record<string, MetadataRecord> = {};
  for (const [key, record] of Object.entries(recordsInput)) {
    records[key] = parseMetadataRecord(record);
  }
  return Object.freeze({ records: Object.freeze(records) });
}

export const MetadataClassificationSchema = createDomainSchema(parseClassification);
export const MetadataNormReferenceSchema = createDomainSchema(parseNormReference);
export const MetadataIndexingSchema = createDomainSchema(parseIndexing);
export const MetadataEditorialSchema = createDomainSchema(parseEditorial);
export const MetadataRecordSchema = createDomainSchema(parseMetadataRecord);
export const MetadataRegistrySchema = createDomainSchema(parseMetadataRegistry);

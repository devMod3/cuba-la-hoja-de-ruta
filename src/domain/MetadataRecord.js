export class MetadataRecord {
  constructor(record = null) {
    this.record = record;
  }

  get exists() {
    return Boolean(this.record);
  }

  get primaryPillar() {
    return this.record?.classification?.primaryPillar ?? null;
  }

  get relatedPillars() {
    return this.record?.classification?.relatedPillars ?? [];
  }

  get type() {
    return this.record?.classification?.type ?? null;
  }

  get documentYear() {
    const value = Number(this.record?.temporal?.documentYear);
    return Number.isFinite(value) && value > 0 ? value : null;
  }
}

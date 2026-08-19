export class MetadataSource {
  getRegistry() {
    throw new Error('MetadataSource.getRegistry() must be implemented');
  }

  subscribe() {
    return () => {};
  }
}

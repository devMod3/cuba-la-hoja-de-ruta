export class ContentSource {
  async listPosts() {
    throw new Error('ContentSource.listPosts() must be implemented');
  }
}

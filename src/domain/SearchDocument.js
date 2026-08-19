export class SearchDocument {
  constructor({ post, metadata = null } = {}) {
    if (!post?.id) throw new Error('SearchDocument requires post.id');

    this.id = String(post.id);
    this.url = post.url ?? '';
    this.title = post.title ?? '(sin título)';
    this.publishedAt = post.publishedAt ?? null;
    this.updatedAt = post.updatedAt ?? null;
    this.metadata = metadata;
  }
}

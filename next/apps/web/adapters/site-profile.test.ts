import { describe, expect, it } from 'vitest';
import {
  isSafeExternalUrl,
  isSafeImageSource,
  parsePublishedSiteProfile,
  readPublishedSiteProfile,
  resourceTypeLabel,
  socialPlatformLabel
} from './site-profile';

function validProfile() {
  return {
    schemaVersion: '1.0.0',
    updatedAt: '2026-08-22T22:40:55.568Z',
    profile: {
      displayName: '  La resistencia  ',
      photoUrl: 'data:image/webp;base64,QUJDRA==',
      bloggerProfileUrl: '',
      email: 'reader@example.com',
      website: 'https://example.com/',
      audioClipUrl: '',
      wishlistUrl: '',
      randomQuestion: '',
      randomAnswer: '',
      gender: '',
      industry: '',
      occupation: '',
      location: { city: 'La Habana', region: '', country: 'Cuba' },
      introduction: 'Texto público',
      interests: ['Constitucionalismo', ' Constitucionalismo ', '', 'Tecnologías'],
      favoriteMovies: [],
      favoriteMusic: [],
      favoriteBooks: []
    },
    social: [
      {
        id: '',
        platform: 'x',
        label: '',
        username: '@example',
        url: 'https://x.com/example',
        visible: true,
        order: 4
      },
      {
        platform: 'unknown',
        url: 'https://example.com/social',
        order: 1
      }
    ],
    relatedResources: [
      {
        title: 'Archivo',
        url: 'https://example.com/archive',
        type: 'archive',
        visible: true,
        order: 2
      },
      {
        title: 'Otro',
        url: 'https://example.com/other',
        type: 'unknown',
        order: 'not-a-number'
      }
    ]
  };
}

describe('published site profile adapter', () => {
  it('reads the canonical repository snapshot used by the public page', async () => {
    const profile = await readPublishedSiteProfile();

    expect(profile.schemaVersion).toBe('1.0.0');
    expect(profile.profile.displayName).toBe('lα_яєѕιѕтєηċια');
    expect(profile.profile.interests).toEqual(['Constitucionalismo', 'Tecnologías']);
    expect(profile.social).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          platform: 'x',
          username: '@la_RsisTncia',
          url: 'https://x.com/la_RsisTncia'
        })
      ])
    );
    expect(profile.relatedResources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Movimiento C40  - (Movimiento constitucionalista Cubano)',
          url: 'https://movimientoc40.com/',
          type: 'source'
        })
      ])
    );
  });

  it('canonicalizes text, collections, ordering and unknown enum values', () => {
    const profile = parsePublishedSiteProfile(validProfile());

    expect(profile.profile.displayName).toBe('La resistencia');
    expect(profile.profile.location).toEqual({ city: 'La Habana', region: '', country: 'Cuba' });
    expect(profile.profile.interests).toEqual(['Constitucionalismo', 'Tecnologías']);
    expect(profile.social.map((item) => item.platform)).toEqual(['other', 'x']);
    expect(profile.social[0]).toMatchObject({ id: 'social-2', visible: true, order: 1 });
    expect(profile.relatedResources.map((item) => item.type)).toEqual(['archive', 'other']);
    expect(profile.relatedResources[1]).toMatchObject({ id: 'resource-2', order: 1 });
  });

  it('rejects malformed schema and unsafe public fields', () => {
    const unsafe = validProfile();
    unsafe.schemaVersion = '2.0.0';
    unsafe.profile.photoUrl = 'data:image/svg+xml;base64,PHN2Zz4=';
    unsafe.profile.email = 'not-an-email';
    unsafe.profile.website = 'javascript:alert(1)';
    unsafe.social[0]!.url = '';
    unsafe.social[1]!.url = 'javascript:alert(1)';
    unsafe.relatedResources[0]!.title = '';
    unsafe.relatedResources[0]!.url = '';
    unsafe.relatedResources[1]!.url = 'javascript:alert(1)';

    expect(() => parsePublishedSiteProfile(unsafe)).toThrow(
      /schemaVersion must be 1\.0\.0.*profile\.photoUrl.*profile\.email.*profile\.website.*social\[0\].*social\[1\].*relatedResources\[0\].*relatedResources\[1\]/
    );
  });

  it('handles missing optional structures and only accepts safe URL/image schemes', () => {
    const minimal = parsePublishedSiteProfile({ schemaVersion: '1.0.0' });

    expect(minimal.updatedAt).toBeNull();
    expect(minimal.profile.displayName).toBe('');
    expect(minimal.social).toEqual([]);
    expect(minimal.relatedResources).toEqual([]);
    expect(isSafeExternalUrl('')).toBe(true);
    expect(isSafeExternalUrl('https://example.com/path')).toBe(true);
    expect(isSafeExternalUrl('http://example.com/path')).toBe(true);
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('http://[')).toBe(false);
    expect(isSafeImageSource('')).toBe(true);
    expect(isSafeImageSource('https://example.com/photo.webp')).toBe(true);
    expect(isSafeImageSource('data:image/png;base64,QUJDRA==')).toBe(true);
    expect(isSafeImageSource('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
  });

  it('exposes the same public labels as the established About contract', () => {
    expect(socialPlatformLabel('x')).toBe('X / Twitter');
    expect(socialPlatformLabel('other')).toBe('Red social');
    expect(resourceTypeLabel('source')).toBe('Fuente');
    expect(resourceTypeLabel('other')).toBe('Recurso');
  });
});

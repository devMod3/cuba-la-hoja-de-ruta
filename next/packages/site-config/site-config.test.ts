import { describe, expect, it } from 'vitest';
import siteProfileSchema from './schema/site-profile.schema.json';
import {
  isSafeAudioSource,
  isSafeExternalUrl,
  isSafeImageSource,
  parsePublishedSiteProfile,
  parseSharedMetadataRegistry,
  parseSiteVocabulary,
  resourceTypeLabel,
  sharedMetadataRegistry,
  siteProfile,
  socialPlatformLabel,
  vocabulary,
  vocabularyIdForLabel,
  vocabularyLabel
} from './src/index';

function validProfile() {
  return {
    schemaVersion: '1.0.0',
    updatedAt: '2026-08-22T22:40:55.568Z',
    profile: {
      displayName: '  La resistencia  ',
      photoUrl: 'data:image/webp;base64,QUJDRA==',
      email: 'reader@example.com',
      website: 'https://example.com/',
      externalProfileUrl: 'https://www.blogger.com/profile/example',
      audioClipUrl: 'data:audio/mpeg;base64,SUQz',
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
      { platform: 'unknown', url: 'https://example.com/social', order: 1 }
    ],
    relatedResources: [
      {
        title: 'Archivo',
        url: 'https://example.com/archive',
        type: 'archive',
        visible: true,
        order: 2
      },
      { title: 'Otro', url: 'https://example.com/other', type: 'unknown', order: 3 }
    ]
  };
}

describe('site config', () => {
  it('exposes validated repository-owned configuration', () => {
    expect(siteProfile.schemaVersion).toBe('1.0.0');
    expect(sharedMetadataRegistry.schemaVersion).toBe('1.0.0');
  });

  it('keeps the durable JSON Schema aligned with the canonical persisted profile', () => {
    const parsed = parsePublishedSiteProfile(validProfile());
    expect(siteProfileSchema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(siteProfileSchema.$id).toBe('urn:zenblog:site-profile:1.0.0');
    expect(siteProfileSchema.additionalProperties).toBe(false);
    expect([...siteProfileSchema.required].sort()).toEqual(
      ['schemaVersion', 'updatedAt', 'profile', 'social', 'relatedResources'].sort()
    );
    expect([...siteProfileSchema.$defs.profile.required].sort()).toEqual(Object.keys(parsed.profile).sort());
    expect([...siteProfileSchema.$defs.location.required].sort()).toEqual(
      Object.keys(parsed.profile.location).sort()
    );
    expect([...siteProfileSchema.$defs.socialEntry.required].sort()).toEqual(
      Object.keys(
        parsed.social[0] ?? {
          id: '',
          platform: '',
          label: '',
          username: '',
          url: '',
          visible: true,
          order: 0
        }
      ).sort()
    );
    expect([...siteProfileSchema.$defs.resourceEntry.required].sort()).toEqual(
      Object.keys(
        parsed.relatedResources[0] ?? {
          id: '',
          title: '',
          url: '',
          description: '',
          type: '',
          visible: true,
          order: 0
        }
      ).sort()
    );
  });

  it('canonicalizes profile collections and enum values', () => {
    const profile = parsePublishedSiteProfile(validProfile());
    expect(profile.profile.displayName).toBe('La resistencia');
    expect(profile.profile.externalProfileUrl).toBe('https://www.blogger.com/profile/example');
    expect(profile.profile.interests).toEqual(['Constitucionalismo', 'Tecnologías']);
    expect(profile.social.map((item) => item.platform)).toEqual(['unknown', 'x']);
    expect(profile.relatedResources.map((item) => item.type)).toEqual(['archive', 'unknown']);
  });

  it('rejects malformed public profile values', () => {
    const unsafe = validProfile();
    unsafe.schemaVersion = '2.0.0';
    unsafe.profile.photoUrl = 'data:image/svg+xml;base64,PHN2Zz4=';
    unsafe.profile.website = 'javascript:alert(1)';
    unsafe.profile.externalProfileUrl = 'javascript:blogger';
    unsafe.profile.audioClipUrl = 'data:text/html;base64,PGgxPk5vPC9oMT4=';
    expect(() => parsePublishedSiteProfile(unsafe)).toThrow(
      /schemaVersion.*photoUrl.*audioClipUrl.*website.*externalProfileUrl/u
    );

    const invalidEmail = validProfile();
    invalidEmail.profile.email = 'not-an-email';
    expect(() => parsePublishedSiteProfile(invalidEmail)).toThrow(/email/u);
  });

  it('enforces stable collection identity and ordering invariants', () => {
    expect(() =>
      parsePublishedSiteProfile({
        ...validProfile(),
        social: [
          {
            id: 'same',
            platform: 'x',
            label: '',
            username: '',
            url: 'https://example.com/one',
            visible: true,
            order: 0
          },
          {
            id: 'same',
            platform: 'github',
            label: '',
            username: '',
            url: 'https://example.com/two',
            visible: true,
            order: 1
          }
        ]
      })
    ).toThrow(/id duplicates/u);

    expect(() =>
      parsePublishedSiteProfile({
        ...validProfile(),
        relatedResources: [
          {
            id: 'one',
            title: 'One',
            url: 'https://example.com/one',
            description: '',
            type: 'project',
            visible: true,
            order: 0
          },
          {
            id: 'two',
            title: 'Two',
            url: 'https://example.com/two',
            description: '',
            type: 'project',
            visible: true,
            order: 0
          }
        ]
      })
    ).toThrow(/order duplicates/u);

    expect(() =>
      parsePublishedSiteProfile({
        ...validProfile(),
        social: [
          {
            id: 'bad-order',
            platform: 'x',
            label: '',
            username: '',
            url: 'https://example.com/social',
            visible: true,
            order: -1
          }
        ]
      })
    ).toThrow(/order must be a non-negative integer/u);
  });

  it('allows incomplete hidden collection entries while validating any supplied URL', () => {
    const hidden = parsePublishedSiteProfile({
      schemaVersion: '1.0.0',
      updatedAt: null,
      profile: {},
      social: [{ id: 'hidden-social', visible: false, url: '', order: 0 }],
      relatedResources: [{ id: 'hidden-resource', title: '', visible: false, url: '', order: 0 }]
    });
    expect(hidden.social[0]).toMatchObject({ id: 'hidden-social', visible: false, url: '' });
    expect(hidden.relatedResources[0]).toMatchObject({
      id: 'hidden-resource',
      visible: false,
      title: '',
      url: ''
    });

    expect(() =>
      parsePublishedSiteProfile({
        ...hidden,
        social: [{ ...hidden.social[0], url: 'javascript:hidden' }]
      })
    ).toThrow(/social\[0\].url is unsafe/u);
  });

  it('validates shared metadata through the domain contract', () => {
    expect(
      parseSharedMetadataRegistry({
        schemaVersion: '1.0.0',
        vocabularyVersion: '1.0.0',
        updatedAt: null,
        records: {}
      }).records
    ).toEqual({});
    expect(() => parseSharedMetadataRegistry({ schemaVersion: '2.0.0' })).toThrow(/schemaVersion/u);
    expect(() =>
      parseSharedMetadataRegistry({
        schemaVersion: '1.0.0',
        vocabularyVersion: '2.0.0',
        records: {}
      })
    ).toThrow(/vocabularyVersion/u);
  });

  it('owns canonical vocabulary ids separately from presentation labels', () => {
    expect(vocabularyIdForLabel(vocabulary.pillars, 'Soberanía')).toBe('soberania');
    expect(vocabularyLabel(vocabulary.types, 'analisis')).toBe('Análisis');
    expect(() => parseSiteVocabulary({ version: '2.0.0' })).toThrow(/version/u);
    expect(() =>
      parseSiteVocabulary({
        ...vocabulary,
        pillars: [{ id: '', label: 'Inválido', aliases: [] }]
      })
    ).toThrow(/requires id and label/u);
  });

  it('keeps URL/media policy and presentation labels stable', () => {
    expect(isSafeExternalUrl('https://example.com/path')).toBe(true);
    expect(isSafeExternalUrl('/relative')).toBe(false);
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('http://[')).toBe(false);
    expect(isSafeImageSource('data:image/png;base64,QUJDRA==')).toBe(true);
    expect(isSafeImageSource('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isSafeAudioSource('data:audio/mpeg;base64,SUQz')).toBe(true);
    expect(isSafeAudioSource('data:text/html;base64,PGgxPk5vPC9oMT4=')).toBe(false);
    expect(socialPlatformLabel('x')).toBe('X / Twitter');
    expect(resourceTypeLabel('source')).toBe('Fuente');
  });

  it('covers safe defaults and fail-closed profile policy branches', () => {
    expect(isSafeExternalUrl('')).toBe(true);
    expect(isSafeImageSource('')).toBe(true);
    expect(isSafeAudioSource('')).toBe(true);
    expect(isSafeImageSource('https://example.com/image.webp')).toBe(true);
    expect(isSafeAudioSource('https://example.com/clip.mp3')).toBe(true);
    expect(isSafeImageSource(`data:image/png;base64,${'A'.repeat(900_001)}`)).toBe(false);
    expect(isSafeAudioSource(`data:audio/mpeg;base64,${'A'.repeat(2_100_001)}`)).toBe(false);

    const minimal = parsePublishedSiteProfile({
      schemaVersion: '1.0.0',
      profile: {},
      social: [{ platform: '', url: 'https://example.com/social', visible: false }],
      relatedResources: [
        { title: 'Resource', type: '', url: 'https://example.com/resource', visible: false }
      ]
    });
    expect(minimal.profile.externalProfileUrl).toBe('');
    expect(minimal.social[0]).toMatchObject({ platform: 'other', visible: false });
    expect(minimal.relatedResources[0]).toMatchObject({ type: 'other', visible: false });

    const unsafe = validProfile();
    unsafe.profile.audioClipUrl = 'javascript:audio';
    unsafe.profile.wishlistUrl = 'javascript:wishlist';
    const firstSocial = unsafe.social[0];
    const secondSocial = unsafe.social[1];
    const firstResource = unsafe.relatedResources[0];
    const secondResource = unsafe.relatedResources[1];
    if (!firstSocial || !secondSocial || !firstResource || !secondResource) {
      throw new Error('Expected profile fixtures');
    }
    firstSocial.url = '';
    secondSocial.url = 'javascript:social';
    firstResource.title = '';
    firstResource.url = '';
    secondResource.url = 'javascript:resource';

    expect(() => parsePublishedSiteProfile(unsafe)).toThrow(
      /audioClipUrl.*wishlistUrl.*social\[0\].*social\[1\].*relatedResources\[0\].*relatedResources\[1\]/u
    );
  });

  it('rejects malformed vocabularies and exposes stable fallback labels', () => {
    expect(() => parseSiteVocabulary({ ...vocabulary, pillars: 'not-an-array' })).toThrow(
      /must be an array/u
    );
    expect(() =>
      parseSiteVocabulary({
        ...vocabulary,
        pillars: [
          { id: 'duplicate', label: 'One', aliases: [] },
          { id: 'duplicate', label: 'Two', aliases: [] }
        ]
      })
    ).toThrow(/duplicate id/u);

    expect(vocabularyIdForLabel(vocabulary.pillars, 'not-present')).toBeNull();
    expect(vocabularyLabel(vocabulary.types, 'not-present', 'Fallback')).toBe('Fallback');
    expect(socialPlatformLabel('future-network')).toBe('future-network');
    expect(socialPlatformLabel('')).toBe('Red social');
    expect(resourceTypeLabel('future-resource')).toBe('future-resource');
    expect(resourceTypeLabel('')).toBe('Recurso');
  });
});

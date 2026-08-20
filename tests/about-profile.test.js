import test from 'node:test';
import assert from 'node:assert/strict';
import { SITE_PROFILE_STORAGE_KEY, emptySiteProfile, canonicalizeSiteProfile, validateSiteProfile, isSafeExternalUrl, isSafeImageSource } from '../tools/about/SiteProfileStore.js';

test('site profile uses an independent v1 storage contract', () => {
  assert.equal(SITE_PROFILE_STORAGE_KEY, 'zenSiteProfile.v1');
  const data = emptySiteProfile();
  assert.equal(data.schemaVersion, '1.0.0');
  assert.deepEqual(Object.keys(data.profile.location), ['city', 'region', 'country']);
});

test('Blogger-style public profile fields are preserved canonically', () => {
  const data = canonicalizeSiteProfile({ profile: {
    displayName:'  Autor  ', photoUrl:'https://example.com/photo.jpg', bloggerProfileUrl:'https://www.blogger.com/profile/123',
    email:'autor@example.com', website:'https://example.com', audioClipUrl:'https://example.com/audio.mp3',
    wishlistUrl:'https://example.com/wishlist', randomQuestion:'¿Una pregunta?', randomAnswer:'Una respuesta',
    gender:'Masculino', industry:'Publicación', occupation:'Editor', location:{city:'La Habana',region:'La Habana',country:'Cuba'},
    introduction:'Introducción', interests:['Historia','Historia','Derecho'], favoriteMovies:['Película'], favoriteMusic:['Música'], favoriteBooks:['Libro']
  } });
  assert.equal(data.profile.displayName, 'Autor');
  assert.deepEqual(data.profile.interests, ['Historia', 'Derecho']);
  assert.equal(data.profile.favoriteBooks[0], 'Libro');
  assert.equal(data.profile.audioClipUrl, 'https://example.com/audio.mp3');
  assert.equal(data.profile.randomAnswer, 'Una respuesta');
});

test('profile validation rejects unsafe URLs', () => {
  assert.equal(isSafeExternalUrl('https://example.com'), true);
  assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
  const result = validateSiteProfile({ profile: { website: 'javascript:alert(1)' } });
  assert.equal(result.ok, false);
});

test('uploaded profile image accepts only bounded image data URLs', () => {
  const safe = `data:image/webp;base64,${'A'.repeat(64)}`;
  assert.equal(isSafeImageSource(safe), true);
  assert.equal(isSafeImageSource('data:text/html;base64,PGgxPk5vPC9oMT4='), false);
  assert.equal(isSafeImageSource('javascript:alert(1)'), false);
  assert.equal(validateSiteProfile({ profile: { photoUrl: safe } }).ok, true);
});

test('social and related resources keep visible/order semantics', () => {
  const data = canonicalizeSiteProfile({ social:[{id:'b',platform:'github',url:'https://github.com/example',visible:false,order:2},{id:'a',platform:'x',url:'https://x.com/example',visible:true,order:1}], relatedResources:[{id:'r1',title:'Archivo',url:'https://example.com/archive',type:'archive',visible:true,order:0}] });
  assert.equal(data.social[0].id, 'a');
  assert.equal(data.social[1].visible, false);
  assert.equal(data.relatedResources[0].type, 'archive');
});
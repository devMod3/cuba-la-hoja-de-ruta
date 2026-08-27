import type { Metadata } from 'next';
import Image from 'next/image';
import {
  readPublishedSiteProfile,
  resourceTypeLabel,
  socialPlatformLabel
} from '../../adapters/site-profile';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'Acerca de',
  description: 'Perfil público de La hoja de ruta.'
};

interface ExternalLinkProps {
  readonly href: string;
  readonly className: string;
  readonly children: React.ReactNode;
}

function ExternalLink({ href, className, children }: ExternalLinkProps) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default async function AboutPage() {
  const data = await readPublishedSiteProfile();
  const { profile } = data;
  const social = data.social.filter((item) => item.visible && item.url);
  const resources = data.relatedResources.filter((item) => item.visible && item.title && item.url);
  const location = [profile.location.city, profile.location.region, profile.location.country]
    .filter(Boolean)
    .join(', ');
  const professional = [profile.occupation, profile.industry].filter(Boolean).join(' · ');
  const identityMeta = [profile.gender, professional, location].filter(Boolean);
  const profileLists: readonly (readonly [string, readonly string[]])[] = [
    ['Intereses', profile.interests],
    ['Películas favoritas', profile.favoriteMovies],
    ['Música favorita', profile.favoriteMusic],
    ['Libros favoritos', profile.favoriteBooks]
  ].filter((entry) => entry[1].length > 0);
  const hasQuestion = Boolean(profile.randomQuestion || profile.randomAnswer);
  const hasProfile = Boolean(
    profile.displayName ||
    profile.photoUrl ||
    profile.introduction ||
    profile.occupation ||
    profile.industry ||
    profile.gender ||
    location ||
    profile.email ||
    profile.website ||
    profile.audioClipUrl ||
    profile.wishlistUrl ||
    profile.bloggerProfileUrl ||
    profileLists.length > 0 ||
    hasQuestion
  );

  if (!hasProfile && social.length === 0 && resources.length === 0) {
    return (
      <main data-component="About" className={styles.page}>
        <div className={`${styles.shell} ${styles.fallback}`}>
          <h1>La hoja de ruta</h1>
          <p className={styles.lead}>
            Plataforma editorial y documental para organizar, leer y recuperar conocimiento sobre
            soberanía, Constitución y Estado.
          </p>
        </div>
      </main>
    );
  }

  const quickLinks = [
    profile.bloggerProfileUrl
      ? { label: 'Blogger ↗', href: profile.bloggerProfileUrl, external: true }
      : null,
    profile.website ? { label: 'Sitio web ↗', href: profile.website, external: true } : null,
    profile.audioClipUrl
      ? { label: 'Audio Clip ↗', href: profile.audioClipUrl, external: true }
      : null,
    profile.wishlistUrl ? { label: 'Wishlist ↗', href: profile.wishlistUrl, external: true } : null,
    profile.email
      ? { label: profile.email, href: `mailto:${profile.email}`, external: false }
      : null
  ].filter((item) => item !== null);

  return (
    <main data-component="About" className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.intro}>
          <div className={styles.profileTop}>
            {profile.photoUrl ? (
              <div className={styles.photoFrame}>
                <Image
                  className={styles.photo}
                  src={profile.photoUrl}
                  alt={profile.displayName ? `Foto de ${profile.displayName}` : 'Foto de perfil'}
                  width={132}
                  height={132}
                  unoptimized
                  priority
                />
              </div>
            ) : null}

            <div className={styles.identity}>
              <h1>{profile.displayName || 'La hoja de ruta'}</h1>
              {identityMeta.length > 0 ? (
                <p className={styles.metaLine}>{identityMeta.join(' · ')}</p>
              ) : null}
              {profile.introduction ? <p className={styles.lead}>{profile.introduction}</p> : null}

              {quickLinks.length > 0 ? (
                <div className={styles.quickLinks} aria-label="Enlaces de perfil">
                  {quickLinks.map((item) =>
                    item.external ? (
                      <ExternalLink key={item.href} className={styles.link} href={item.href}>
                        {item.label}
                      </ExternalLink>
                    ) : (
                      <a key={item.href} className={styles.link} href={item.href}>
                        {item.label}
                      </a>
                    )
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {profileLists.length > 0 || hasQuestion || social.length > 0 || resources.length > 0 ? (
          <div className={styles.divider} aria-hidden="true" />
        ) : null}

        {profileLists.length > 0 ? (
          <section className={styles.section} aria-labelledby="about-profile-heading">
            <div className={styles.sectionHead}>
              <h2 id="about-profile-heading">Perfil</h2>
            </div>
            <div className={styles.profileLists}>
              {profileLists.map(([title, items]) => (
                <section className={styles.profileList} key={title}>
                  <h3>{title}</h3>
                  <ul>
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>
        ) : null}

        {hasQuestion ? (
          <section className={styles.section} aria-labelledby="about-question-heading">
            <div className={styles.sectionHead}>
              <h2 id="about-question-heading">Pregunta y respuesta</h2>
            </div>
            {profile.randomQuestion ? (
              <h3 className={styles.question}>{profile.randomQuestion}</h3>
            ) : null}
            {profile.randomAnswer ? <p className={styles.answer}>{profile.randomAnswer}</p> : null}
          </section>
        ) : null}

        {social.length > 0 ? (
          <section className={styles.section} aria-labelledby="about-social-heading">
            <div className={styles.sectionHead}>
              <h2 id="about-social-heading">Redes sociales</h2>
            </div>
            <div className={styles.socialList}>
              {social.map((item) => (
                <ExternalLink key={item.id} className={styles.social} href={item.url}>
                  <span className={styles.socialCopy}>
                    <span className={styles.socialName}>
                      {item.label || socialPlatformLabel(item.platform)}
                    </span>
                    {item.username ? (
                      <span className={styles.socialUser}>{item.username}</span>
                    ) : null}
                  </span>
                </ExternalLink>
              ))}
            </div>
          </section>
        ) : null}

        {resources.length > 0 ? (
          <section className={styles.section} aria-labelledby="about-resources-heading">
            <div className={styles.sectionHead}>
              <h2 id="about-resources-heading">Recursos relacionados</h2>
            </div>
            <div className={styles.resourceList}>
              {resources.map((item) => (
                <ExternalLink key={item.id} className={styles.resource} href={item.url}>
                  <span className={styles.resourceCopy}>
                    <span className={styles.resourceTop}>
                      <strong>{item.title}</strong>
                      <span className={styles.resourceType}>{resourceTypeLabel(item.type)}</span>
                    </span>
                    {item.description ? (
                      <span className={styles.resourceDescription}>{item.description}</span>
                    ) : null}
                  </span>
                </ExternalLink>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';

type CopyState = 'idle' | 'copied' | 'error';

function copyStatusMessage(state: CopyState): string {
  if (state === 'copied') return 'Referencia copiada al portapapeles.';
  if (state === 'error') return 'No se pudo copiar automáticamente.';
  return '';
}

export function ArticleReaderProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const scheduleUpdate = () => {
      if (frame !== 0) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
        const nextProgress =
          maximumScroll <= 0
            ? 100
            : Math.min(100, Math.max(0, (window.scrollY / maximumScroll) * 100));

        setProgress(Math.round(nextProgress));
      });
    };

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="reader-progress"
      role="progressbar"
      aria-label="Progreso de lectura"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-valuetext={`${String(progress)}% leído`}
    >
      <span style={{ transform: `scaleX(${String(progress / 100)})` }} />
    </div>
  );
}

export function ArticleReaderActions({ referenceText }: { readonly referenceText: string }) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const copyReference = () => {
    void navigator.clipboard.writeText(referenceText).then(
      () => {
        setCopyState('copied');
      },
      () => {
        setCopyState('error');
      }
    );
  };

  const printArticle = () => {
    window.print();
  };

  return (
    <div className="reader-actions" aria-label="Herramientas de lectura">
      <button type="button" onClick={copyReference}>
        {copyState === 'copied' ? 'Referencia copiada' : 'Copiar referencia'}
      </button>
      <button type="button" onClick={printArticle}>
        Imprimir
      </button>
      <p className="reader-action-status" role="status" aria-live="polite">
        {copyStatusMessage(copyState)}
      </p>
    </div>
  );
}

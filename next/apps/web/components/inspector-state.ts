export const INSPECTOR_STORAGE_KEY = 'zenInspector.enabled';
const INSPECTOR_EVENT = 'zeninspector:changed';

export function getInspectorSnapshot(): boolean {
  try {
    return globalThis.localStorage.getItem(INSPECTOR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getInspectorServerSnapshot(): boolean {
  return false;
}

export function subscribeInspector(listener: () => void): () => void {
  const localListener: EventListener = () => {
    listener();
  };
  const storageListener = (event: StorageEvent) => {
    if (event.key === INSPECTOR_STORAGE_KEY) listener();
  };
  document.addEventListener(INSPECTOR_EVENT, localListener);
  window.addEventListener('storage', storageListener);
  return () => {
    document.removeEventListener(INSPECTOR_EVENT, localListener);
    window.removeEventListener('storage', storageListener);
  };
}

export function setInspectorEnabled(value: boolean): void {
  try {
    globalThis.localStorage.setItem(INSPECTOR_STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    // The inspector remains functional for the current session even without persistent storage.
  }
  document.dispatchEvent(new CustomEvent(INSPECTOR_EVENT));
}

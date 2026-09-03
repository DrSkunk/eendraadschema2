export type SaveDestination = 'disk' | 'google-drive';

const STORAGE_KEY = 'eendraadschema.saveDestination';
const CHANGE_EVENT = 'save-destination-change';

export function getSaveDestination(): SaveDestination {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'google-drive'
      ? 'google-drive'
      : 'disk';
  } catch {
    return 'disk';
  }
}

export function setSaveDestination(destination: SaveDestination): void {
  try {
    localStorage.setItem(STORAGE_KEY, destination);
  } catch {
    // Storage can be unavailable in private browsing; current tab still updates.
  }
  window.dispatchEvent(
    new CustomEvent<SaveDestination>(CHANGE_EVENT, { detail: destination })
  );
}

export function onSaveDestinationChange(
  listener: (destination: SaveDestination) => void
): () => void {
  const handler = (event: Event) => {
    listener((event as CustomEvent<SaveDestination>).detail);
  };
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

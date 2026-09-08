import {
  downloadCurrentStructureCopy,
  saveCurrentStructureToLocalFile,
} from "../importExport/importExport";
import { googleDriveService } from "./GoogleDriveService";
import { saveCurrentStructureToGoogleDrive } from "./GoogleDriveActions";
import {
  getSaveDestination,
  notifyDocumentStorageStateChanged,
  setSaveDestination,
  StorageBackendId,
} from "./SaveDestination";

export type StorageFormat = "eds" | "json";

export function currentStorageFormat(): StorageFormat {
  const filename = globalThis.structure?.properties?.filename || "";
  return filename.toLowerCase().endsWith(".json") ? "json" : "eds";
}

export async function openFromLocalFile(): Promise<void> {
  await globalThis.loadClicked();
  googleDriveService.clearCurrentFile();
  setSaveDestination("local-file");
  notifyDocumentStorageStateChanged();
}

export async function saveToBackend(
  backendId: StorageBackendId,
  format: StorageFormat,
  saveAs = false
): Promise<boolean> {
  if (backendId === "google-drive") {
    const savedFile = await saveCurrentStructureToGoogleDrive(format, saveAs);
    return savedFile !== null;
  }

  await saveCurrentStructureToLocalFile(saveAs, format);
  setSaveDestination("local-file");
  notifyDocumentStorageStateChanged();
  return true;
}

export async function saveToActiveBackend(
  format: StorageFormat = currentStorageFormat(),
  saveAs = false
): Promise<boolean> {
  return saveToBackend(getSaveDestination(), format, saveAs);
}

export function downloadCopy(format: StorageFormat): void {
  downloadCurrentStructureCopy(format);
}

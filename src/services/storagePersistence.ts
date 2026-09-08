export interface StorageQuotaInfo {
  usageMB: number;
  quotaMB: number;
  percentUsed: number;
}

export interface PersistenceStatus {
  isPersisted: boolean;
  quota?: StorageQuotaInfo;
}

/**
 * Requests browser permission for persistent storage.
 * Prevents the browser from evicting IndexedDB data when the device is low on disk space.
 */
export async function requestPersistentStorage(): Promise<PersistenceStatus> {
  if (typeof window === "undefined" || !navigator.storage) {
    return { isPersisted: false };
  }

  let isPersisted = false;
  try {
    if (navigator.storage.persist) {
      isPersisted = await navigator.storage.persist();
    } else if (navigator.storage.persisted) {
      isPersisted = await navigator.storage.persisted();
    }
  } catch (err) {
    console.warn("Could not request persistent storage:", err);
  }

  let quota: StorageQuotaInfo | undefined;
  try {
    if (navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      if (est.usage !== undefined && est.quota !== undefined && est.quota > 0) {
        quota = {
          usageMB: Math.round((est.usage / (1024 * 1024)) * 10) / 10,
          quotaMB: Math.round((est.quota / (1024 * 1024)) * 10) / 10,
          percentUsed: Math.round((est.usage / est.quota) * 100),
        };
      }
    }
  } catch (err) {
    console.warn("Could not retrieve storage estimate:", err);
  }

  return { isPersisted, quota };
}

/**
 * Checks if the browser has already granted persistent storage permission.
 */
export async function isStoragePersisted(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !navigator.storage ||
    !navigator.storage.persisted
  ) {
    return false;
  }
  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

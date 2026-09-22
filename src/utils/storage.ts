/**
 * Safely reads, parses JSON, and optionally validates an item from localStorage.
 * Returns `null` if the item does not exist, fails to parse, or fails validation.
 */
export function getStorageItem<T>(
  key: string,
  validator?: (data: unknown) => data is T,
): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (validator) {
      return validator(parsed) ? parsed : null;
    }

    return parsed as T;
  } catch (error) {
    console.error(`Error reading key "${key}" from localStorage:`, error);
    return null;
  }
}

/**
 * Safely stringifies and saves an item to localStorage.
 * If value is null or undefined, it automatically removes the key.
 */
export function setStorageItem<T>(
  key: string,
  value: T | null | undefined,
): void {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Error saving key "${key}" to localStorage:`, error);
  }
}

/**
 * Removes an item from localStorage.
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing key "${key}" from localStorage:`, error);
  }
}

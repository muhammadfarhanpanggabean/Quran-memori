import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Score, StoredScores } from '../types';
import { DATA_VERSION } from '../constants';

// Fix: Imported `Dispatch` and `SetStateAction` from 'react' to fix namespace errors in the return type, and removed a stray comma in the generic type definition.
function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const parsedItem = JSON.parse(item);

      if (key === 'quran-game-scores') {
        // If it's an array, it's the old format. Migrate it.
        if (Array.isArray(parsedItem)) {
          console.log('Migrating old score data to new versioned format.');
          const migratedData: StoredScores = {
            version: DATA_VERSION,
            data: parsedItem as Score[],
          };
          window.localStorage.setItem(key, JSON.stringify(migratedData));
          return migratedData.data as unknown as T;
        }

        // If it's an object with a version and data, it's the new format.
        if (typeof parsedItem === 'object' && parsedItem !== null && 'version' in parsedItem && 'data' in parsedItem) {
          const versionedData = parsedItem as StoredScores;
          if (versionedData.version !== DATA_VERSION) {
              console.warn(`Data version mismatch. Stored: ${versionedData.version}, App: ${DATA_VERSION}.`);
              // Future migration logic from v1 to v2 would go here.
          }
          return versionedData.data as unknown as T;
        }
        
        console.warn(`Malformed data for key "${key}". Resetting to initial value.`);
        return initialValue;
      }

      return parsedItem;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        if (key === 'quran-game-scores') {
          const dataToPersist: StoredScores = {
            version: DATA_VERSION,
            data: valueToStore as unknown as Score[],
          };
          window.localStorage.setItem(key, JSON.stringify(dataToPersist));
        } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key) {
            try {
                if (!e.newValue) {
                    setStoredValue(initialValue);
                    return;
                }
                const parsedNewValue = JSON.parse(e.newValue);

                if (key === 'quran-game-scores') {
                    if (typeof parsedNewValue === 'object' && parsedNewValue !== null && 'data' in parsedNewValue) {
                        setStoredValue((parsedNewValue as StoredScores).data as unknown as T);
                    } else {
                         setStoredValue(initialValue);
                    }
                } else {
                    setStoredValue(parsedNewValue);
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;

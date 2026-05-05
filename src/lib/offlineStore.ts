import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SyncItem<T> {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: string;
  data: T;
  timestamp: number;
}

export const usePersistentState = <T>(key: string, initialValue: T) => {
  const [state, setState] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem(key);
        if (saved !== null) {
          setState(JSON.parse(saved));
        }
      } catch (e) {
        console.error(`Error loading state ${key}:`, e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadState();
  }, [key]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(key, JSON.stringify(state)).catch(e => {
        console.error(`Error saving state ${key}:`, e);
      });
    }
  }, [key, state, isLoaded]);

  return [state, setState, isLoaded] as const;
};

export const useSyncQueue = () => {
  const [queue, setQueue, isLoaded] = usePersistentState<SyncItem<any>[]>('os_sync_queue', []);
  const [isSyncing, setIsSyncing] = useState(false);

  const addToQueue = useCallback((item: Omit<SyncItem<any>, 'timestamp'>) => {
    setQueue(prev => [...prev, { ...item, timestamp: Date.now() }]);
  }, [setQueue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, [setQueue]);

  const processQueue = useCallback(async (processor: (item: SyncItem<any>) => Promise<boolean>) => {
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const newQueue = [...queue];
    const failedItems: SyncItem<any>[] = [];

    for (const item of newQueue) {
      try {
        const success = await processor(item);
        if (!success) failedItems.push(item);
      } catch (e) {
        failedItems.push(item);
      }
    }

    setQueue(failedItems);
    setIsSyncing(false);
  }, [queue, isSyncing, setQueue]);

  return { queue, addToQueue, clearQueue, processQueue, isSyncing, isLoaded };
};

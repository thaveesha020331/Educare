import { useState, useEffect } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Would be installed as dependency
// Note: @react-native-netinfo/netinfo would be installed as dependency
// For now, we'll stub the network detection
// import NetInfo from '@react-native-netinfo/netinfo';

// Stub AsyncStorage implementation
const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    // In real implementation, this would read from device storage
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    // In real implementation, this would write to device storage
    console.log(`AsyncStorage.setItem: ${key} = ${value.substring(0, 100)}...`);
  },
  removeItem: async (key: string): Promise<void> => {
    // In real implementation, this would remove from device storage
    console.log(`AsyncStorage.removeItem: ${key}`);
  },
};

interface QueueItem<T = any> {
  id: string;
  data: T;
  timestamp: string;
  bucket: string;
}

export const useOfflineQueue = () => {
  const [isOnlineState, setIsOnlineState] = useState(true);

  useEffect(() => {
    // Stub network detection - would use NetInfo in real implementation
    // const unsubscribe = NetInfo.addEventListener(state => {
    //   setIsOnlineState(state.isConnected ?? false);
    // });
    // return () => unsubscribe();
    
    // For now, assume always online
    setIsOnlineState(true);
  }, []);

  const queue = async <T>(bucket: string, item: T): Promise<string> => {
    try {
      const localId = `${bucket}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const queueItem: QueueItem<T> = {
        id: localId,
        data: item,
        timestamp: new Date().toISOString(),
        bucket,
      };

      // Get existing queue for this bucket
      const existingQueue = await getQueue(bucket);
      const updatedQueue = [...existingQueue, queueItem];

      // Store updated queue
      await AsyncStorage.setItem(`offline:${bucket}`, JSON.stringify(updatedQueue));
      
      return localId;
    } catch (error) {
      console.error('Failed to queue item:', error);
      throw new Error('Failed to queue item for offline storage');
    }
  };

  const getQueue = async <T>(bucket: string): Promise<QueueItem<T>[]> => {
    try {
      const queueData = await AsyncStorage.getItem(`offline:${bucket}`);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Failed to get queue:', error);
      return [];
    }
  };

  const clearQueue = async (bucket: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(`offline:${bucket}`);
    } catch (error) {
      console.error('Failed to clear queue:', error);
    }
  };

  const removeFromQueue = async (bucket: string, itemId: string): Promise<void> => {
    try {
      const existingQueue = await getQueue(bucket);
      const updatedQueue = existingQueue.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(`offline:${bucket}`, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Failed to remove item from queue:', error);
    }
  };

  const sync = async (bucket: string): Promise<{ success: number; failed: number }> => {
    if (!isOnlineState) {
      throw new Error('Cannot sync while offline');
    }

    try {
      const queueItems = await getQueue(bucket);
      let successCount = 0;
      let failedCount = 0;

      for (const item of queueItems) {
        try {
          // This would call the actual API
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/${bucket}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item.data),
          });

          if (response.ok) {
            await removeFromQueue(bucket, item.id);
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          failedCount++;
        }
      }

      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('Failed to sync queue:', error);
      throw new Error('Failed to sync offline queue');
    }
  };

  const getQueueCount = async (bucket: string): Promise<number> => {
    try {
      const queue = await getQueue(bucket);
      return queue.length;
    } catch (error) {
      console.error('Failed to get queue count:', error);
      return 0;
    }
  };

  const isOnline = (): boolean => {
    return isOnlineState;
  };

  return {
    queue,
    getQueue,
    clearQueue,
    removeFromQueue,
    sync,
    getQueueCount,
    isOnline,
  };
};

export default useOfflineQueue;

import { soundAlerts } from './audioAlerts';

/**
 * PWA Offline Storage & Background Sync Manager for Drivers
 * Enables rural/offline delivery marking, bill photo caching, and automatic SQLite sync upon reconnecting.
 */

const STORAGE_KEY = 'vetri_indane_offline_queue';

export interface QueuedAction {
  id: string;
  type: 'DELIVERY_FULFILLMENT' | 'BILL_COLLECTION' | 'VEHICLE_EXPENSE';
  payload: any;
  timestamp: string;
}

class OfflineSyncManager {
  private listeners: Array<(isOnline: boolean, queuedCount: number) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkRestore());
      window.addEventListener('offline', () => this.notifyListeners());
    }
  }

  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public getQueue(): QueuedAction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public queueAction(type: QueuedAction['type'], payload: any): QueuedAction {
    const queue = this.getQueue();
    const action: QueuedAction = {
      id: `offline-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    queue.push(action);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    this.notifyListeners();
    return action;
  }

  public async handleNetworkRestore(): Promise<number> {
    const queue = this.getQueue();
    if (queue.length === 0) return 0;

    console.log(`[PWA AUTO-SYNC] Internet restored! Processing ${queue.length} queued offline driver actions...`);
    let syncedCount = 0;

    const remainingQueue: QueuedAction[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'BILL_COLLECTION') {
          await fetch('http://localhost:5000/api/bills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
        } else if (item.type === 'VEHICLE_EXPENSE') {
          await fetch('http://localhost:5000/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...item.payload, userRole: 'DRIVER' }),
          });
        }
        syncedCount++;
      } catch (err) {
        console.error('Failed to sync queued item, retaining in queue:', item, err);
        remainingQueue.push(item);
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingQueue));
    this.notifyListeners();

    if (syncedCount > 0) {
      soundAlerts.playSuccessSyncChime();
    }

    return syncedCount;
  }

  public subscribe(cb: (isOnline: boolean, queuedCount: number) => void) {
    this.listeners.push(cb);
    cb(this.isOnline(), this.getQueue().length);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notifyListeners() {
    const online = this.isOnline();
    const count = this.getQueue().length;
    this.listeners.forEach(cb => cb(online, count));
  }
}

export const offlineSync = new OfflineSyncManager();

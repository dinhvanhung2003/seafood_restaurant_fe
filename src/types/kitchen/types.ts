export type VoidSource = 'cashier' | 'waiter' | 'kitchen';

export interface VoidEvent {
  id: string;
  at: string;            
  tableId: string | null;
  tableName: string | null;
  menuItemId: string;
  menuItemName: string;
  qty: number;
  source: VoidSource;
  by: string | null;     
  reason: string | null;
  byName ?: string | null;
}

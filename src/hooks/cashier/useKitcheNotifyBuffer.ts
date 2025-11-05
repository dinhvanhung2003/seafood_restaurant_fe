// useKitchenNotifyBuffer.ts
import { useMemo, useRef, useState } from "react";

export type DeltaMap = Record<string, number>; // orderItemId -> delta(+/-)

export function useKitchenNotifyBuffer() {
  const [delta, setDelta] = useState<DeltaMap>({});
  const loadingRef = useRef(false);

  const inc = (orderItemId: string, qty = 1) =>
    setDelta(prev => ({ ...prev, [orderItemId]: (prev[orderItemId] ?? 0) + qty }));

  const dec = (orderItemId: string, qty = 1) =>
    setDelta(prev => {
      const next = { ...prev, [orderItemId]: (prev[orderItemId] ?? 0) - qty };
      // dọn key về 0 thì xoá cho sạch
      if (next[orderItemId] === 0) delete next[orderItemId];
      return next;
    });

  const clear = () => setDelta({});

  const positiveItems = useMemo(
    () => Object.entries(delta).filter(([, d]) => d > 0),
    [delta]
  );

  const canNotify = positiveItems.length > 0 && !loadingRef.current;

  return {
    delta, inc, dec, clear,
    positiveItems, canNotify,
    setLoading: (b: boolean) => (loadingRef.current = b),
  };
}

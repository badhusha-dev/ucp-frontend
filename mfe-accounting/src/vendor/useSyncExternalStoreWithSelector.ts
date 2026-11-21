// ESM stand-in for 'use-sync-external-store/shim/with-selector', which recharts 3 imports.
//
// That package is CommonJS and does require('react'), which module federation cannot point at the host's React, so it
// ran on this remote's own React copy and every chart crashed the page ("Cannot read properties of null (reading
// 'useRef')"). This version imports React normally, so the shared host React is used. React 18 has
// useSyncExternalStore built in; this adds the memoised selector on top of it, with the same semantics.
import * as React from 'react';

type Subscribe = (onStoreChange: () => void) => () => void;

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: Subscribe,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
): Selection {
  // The last selection React rendered, so an equal new selection can keep the old reference.
  const instRef = React.useRef<{ hasValue: boolean; value: Selection | undefined } | null>(null);
  if (instRef.current === null) instRef.current = { hasValue: false, value: undefined };
  const inst = instRef.current;

  const [getSelection, getServerSelection] = React.useMemo(() => {
    let hasMemo = false;
    let memoizedSnapshot: Snapshot;
    let memoizedSelection: Selection;
    const memoizedSelector = (nextSnapshot: Snapshot): Selection => {
      if (!hasMemo) {
        hasMemo = true;
        memoizedSnapshot = nextSnapshot;
        const nextSelection = selector(nextSnapshot);
        if (isEqual !== undefined && inst.hasValue && isEqual(inst.value as Selection, nextSelection)) {
          memoizedSelection = inst.value as Selection;
          return memoizedSelection;
        }
        memoizedSelection = nextSelection;
        return nextSelection;
      }
      if (Object.is(memoizedSnapshot, nextSnapshot)) return memoizedSelection;
      const nextSelection = selector(nextSnapshot);
      if (isEqual !== undefined && isEqual(memoizedSelection, nextSelection)) {
        memoizedSnapshot = nextSnapshot;
        return memoizedSelection;
      }
      memoizedSnapshot = nextSnapshot;
      memoizedSelection = nextSelection;
      return nextSelection;
    };
    const fromSnapshot = () => memoizedSelector(getSnapshot());
    const fromServerSnapshot = getServerSnapshot == null ? undefined : () => memoizedSelector(getServerSnapshot());
    return [fromSnapshot, fromServerSnapshot] as const;
  }, [getSnapshot, getServerSnapshot, selector, isEqual]);

  const value = React.useSyncExternalStore(subscribe, getSelection, getServerSelection);
  React.useEffect(() => {
    inst.hasValue = true;
    inst.value = value;
  }, [value]);
  React.useDebugValue(value);
  return value;
}

export default { useSyncExternalStoreWithSelector };

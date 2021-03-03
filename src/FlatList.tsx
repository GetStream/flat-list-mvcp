import React, { MutableRefObject, useRef } from 'react';
import { FlatList, FlatListProps, NativeModules, Platform } from 'react-native';
import debounce from 'lodash/debounce';
export const MvcpScrollViewManager = NativeModules.MvcpScrollViewManager;

const debouncedEnable = debounce(
  (
    cleanupPromiseRef: MutableRefObject<Promise<any> | null>,
    viewTag: any,
    autoscrollToTopThreshold: number,
    minIndexForVisible: number
  ) => {
    cleanupPromiseRef.current = MvcpScrollViewManager.enableMaintainVisibleContentPosition(
      viewTag,
      autoscrollToTopThreshold || -Number.MAX_SAFE_INTEGER,
      minIndexForVisible || 1
    );
  },
  100,
  {
    trailing: true,
  }
);

const debouncedDisable = debounce(
  (cleanupPromiseRef: MutableRefObject<Promise<any> | null>) => {
    cleanupPromiseRef.current &&
      cleanupPromiseRef.current?.then((handle) => {
        MvcpScrollViewManager.disableMaintainVisibleContentPosition(handle);
      });
  },
  50,
  {
    trailing: true,
  }
);

export default (React.forwardRef(
  <T extends any>(
    props: FlatListProps<T>,
    forwardedRef:
      | ((instance: FlatList<T> | null) => void)
      | MutableRefObject<FlatList<T> | null>
      | null
  ) => {
    const flRef = useRef<FlatList<T> | null>(null);
    const { maintainVisibleContentPosition: mvcp } = props;

    const autoscrollToTopThreshold = useRef<number | null>();
    const minIndexForVisible = useRef<number>();
    const cleanupPromiseRef = useRef<Promise<any> | null>(null);

    const resetMvcpIfNeeded = (): void => {
      if (!mvcp || Platform.OS !== 'android' || !flRef.current) {
        return;
      }

      debouncedDisable(cleanupPromiseRef);

      autoscrollToTopThreshold.current = mvcp?.autoscrollToTopThreshold;
      minIndexForVisible.current = mvcp?.minIndexForVisible;

      const viewTag = flRef.current.getScrollableNode();
      debouncedEnable(
        cleanupPromiseRef,
        viewTag,
        autoscrollToTopThreshold.current || -Number.MAX_SAFE_INTEGER,
        minIndexForVisible.current || 1
      );
    };

    return (
      <FlatList<T>
        {...props}
        ref={(ref) => {
          flRef.current = ref;

          resetMvcpIfNeeded();
          if (typeof forwardedRef === 'function') {
            forwardedRef(ref);
          } else if (forwardedRef?.current) {
            forwardedRef.current = ref;
          }
        }}
      />
    );
  }
) as unknown) as typeof FlatList;

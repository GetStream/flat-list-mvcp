import React, { MutableRefObject, useRef } from 'react';
import {
  FlatList,
  FlatListProps,
  findNodeHandle,
  NativeModules,
  Platform,
} from 'react-native';

export const MvcpScrollViewManager = NativeModules.MvcpScrollViewManager;

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
    const cleanupPromiseRef = useRef<Promise<any>>();

    const getAutoscrollToTopThresholdFromProp = () =>
      mvcp?.autoscrollToTopThreshold || -Number.MAX_SAFE_INTEGER;

    const getMinIndexForVisibleFromProp = () => mvcp?.minIndexForVisible || 1;

    const resetMvcpIfNeeded = (): void => {
      if (!mvcp || Platform.OS !== 'android' || !flRef.current) {
        return;
      }
      if (
        autoscrollToTopThreshold.current ===
          getAutoscrollToTopThresholdFromProp() &&
        minIndexForVisible.current === getMinIndexForVisibleFromProp()
      ) {
        // Don't do anythinig if the values haven't changed
        return;
      }

      cleanupPromiseRef.current &&
        cleanupPromiseRef.current?.then((handle) => {
          MvcpScrollViewManager.disableMaintainVisibleContentPosition(handle);
        });

      autoscrollToTopThreshold.current = getAutoscrollToTopThresholdFromProp();
      minIndexForVisible.current = getMinIndexForVisibleFromProp();

      const viewTag = findNodeHandle(flRef.current);
      cleanupPromiseRef.current = MvcpScrollViewManager.enableMaintainVisibleContentPosition(
        viewTag,
        autoscrollToTopThreshold.current,
        minIndexForVisible.current
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

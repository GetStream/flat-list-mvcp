import React, { MutableRefObject, useRef } from 'react';
import {
  FlatList,
  FlatListProps,
  findNodeHandle,
  NativeModules,
  Platform,
} from 'react-native';

export type maintainVisibleContentPositionPropType = {
  autoscrollToTopThreshold?: number;
  minIndexForVisible: number;
};

export type FlatListComponentPropType<T = any> = FlatListProps<T> & {
  maintainVisibleContentPosition: maintainVisibleContentPositionPropType;
};
export const MvcpScrollViewManager = NativeModules.MvcpScrollViewManager;

export default React.forwardRef(
  <T extends any>(
    props: FlatListComponentPropType<T>,
    forwardedRef:
      | ((instance: FlatList<T> | null) => void)
      | MutableRefObject<FlatList<T> | null>
      | null
  ) => {
    const flRef = useRef<FlatList<T>>();
    const { maintainVisibleContentPosition: mvcp } = props;

    const autoscrollToTopThreshold = useRef<number>();
    const minIndexForVisible = useRef<number>();
    const cleanupPromiseRef = useRef<Promise<any>>();

    const resetMvcpIfNeeded = (): void => {
      if (!mvcp || Platform.OS !== 'android' || !flRef?.current) {
        return;
      }
      if (
        autoscrollToTopThreshold.current === mvcp.autoscrollToTopThreshold &&
        minIndexForVisible.current === mvcp.minIndexForVisible
      ) {
        // Don't do anythinig if the values haven't changed
        return;
      }

      cleanupPromiseRef.current &&
        cleanupPromiseRef.current?.then((handle) => {
          MvcpScrollViewManager.disableMaintainVisibleContentPosition(handle);
        });

      autoscrollToTopThreshold.current =
        mvcp.autoscrollToTopThreshold || -Number.MAX_SAFE_INTEGER;
      minIndexForVisible.current = mvcp.minIndexForVisible || 0;

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
          // @ts-ignore
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
);

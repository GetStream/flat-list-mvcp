import React, { MutableRefObject, useRef } from 'react';
import { FlatList, FlatListProps, NativeModules, Platform } from 'react-native';
import debounce from 'lodash/debounce';

export const MvcpScrollViewManager = NativeModules.MvcpScrollViewManager;

const debouncedEnable = debounce(
  (
    enableMvcpPromise: MutableRefObject<Promise<any> | null>,
    disableMvcpPromise: MutableRefObject<Promise<any> | null>,
    viewTag: any,
    autoscrollToTopThreshold: number,
    minIndexForVisible: number
  ) => {
    if (disableMvcpPromise.current) {
      disableMvcpPromise.current.then(() => {
        enableMvcpPromise.current = MvcpScrollViewManager.enableMaintainVisibleContentPosition(
          viewTag,
          autoscrollToTopThreshold,
          minIndexForVisible
        );
      });
    } else {
      enableMvcpPromise.current = MvcpScrollViewManager.enableMaintainVisibleContentPosition(
        viewTag,
        autoscrollToTopThreshold,
        minIndexForVisible
      );
    }
  },
  100,
  {
    trailing: true,
  }
);

const debouncedDisable = debounce(
  (
    enableMvcpPromise: MutableRefObject<Promise<any> | null>,
    disableMvcpPromise: MutableRefObject<Promise<any> | null>
  ) => {
    enableMvcpPromise.current?.then((handle) => {
      disableMvcpPromise.current = MvcpScrollViewManager.disableMaintainVisibleContentPosition(
        handle
      );
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
    const enableMvcpPromise = useRef<Promise<any> | null>(null);
    const disableMvcpPromise = useRef<Promise<any> | null>(null);

    const resetMvcpIfNeeded = (): void => {
      if (!mvcp || Platform.OS !== 'android' || !flRef.current) {
        return;
      }

      enableMvcpPromise &&
        enableMvcpPromise.current &&
        debouncedDisable(enableMvcpPromise, disableMvcpPromise);

      autoscrollToTopThreshold.current = mvcp?.autoscrollToTopThreshold;
      minIndexForVisible.current = mvcp?.minIndexForVisible;

      const viewTag = flRef.current.getScrollableNode();
      debouncedEnable(
        enableMvcpPromise,
        disableMvcpPromise,
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
          } else if (forwardedRef) {
            forwardedRef.current = ref;
          }
        }}
      />
    );
  }
) as unknown) as typeof FlatList;

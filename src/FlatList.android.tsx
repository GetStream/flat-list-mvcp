import React, { MutableRefObject, useEffect, useRef } from 'react';
import { FlatList, FlatListProps, NativeModules, Platform } from 'react-native';

export const ScrollViewManager = NativeModules.MvcpScrollViewManager;

export default (React.forwardRef(
  <T extends any>(
    props: FlatListProps<T>,
    forwardedRef:
      | ((instance: FlatList<T> | null) => void)
      | MutableRefObject<FlatList<T> | null>
      | null
  ) => {
    const { maintainVisibleContentPosition: mvcp } = props;

    const flRef = useRef<FlatList<T> | null>(null);
    const isMvcpEnabled = useRef<any>(null);
    const autoscrollToTopThreshold = useRef<number | null>();
    const minIndexForVisible = useRef<number>();
    const handle = useRef<any>(null);
    const enableMvcpRetries = useRef<number>(0);

    const propAutoscrollToTopThreshold =
      mvcp?.autoscrollToTopThreshold || -Number.MAX_SAFE_INTEGER;
    const propMinIndexForVisible = mvcp?.minIndexForVisible || 1;
    const hasMvcpChanged =
      autoscrollToTopThreshold.current !== propAutoscrollToTopThreshold ||
      minIndexForVisible.current !== propMinIndexForVisible;
    const enableMvcp = () => {
      if (!flRef.current) return;

      const scrollableNode = flRef.current.getScrollableNode();
      const enableMvcpPromise = ScrollViewManager.enableMaintainVisibleContentPosition(
        scrollableNode,
        autoscrollToTopThreshold.current,
        minIndexForVisible.current
      );

      return enableMvcpPromise.then((_handle: number) => {
        handle.current = _handle;
        enableMvcpRetries.current = 0;
      });
    };

    const enableMvcpWithRetries = () => {
      return enableMvcp()?.catch(() => {
        /**
         * enableMaintainVisibleContentPosition from native module may throw IllegalViewOperationException,
         * in case view is not ready yet. In that case, lets do a retry!!
         */
        if (enableMvcpRetries.current < 10) {
          setTimeout(enableMvcpWithRetries, 10);
          enableMvcpRetries.current += 1;
        }
      });
    };

    const disableMvcp: () => Promise<void> = () => {
      if (!ScrollViewManager || !handle?.current) {
        return Promise.resolve();
      }

      return ScrollViewManager.disableMaintainVisibleContentPosition(
        handle.current
      );
    };

    // We can only call enableMaintainVisibleContentPosition once the ref to underlying scrollview is ready.
    const resetMvcpIfNeeded = (): void => {
      if (!mvcp || Platform.OS !== 'android' || !flRef.current) {
        return;
      }

      /**
       * If the enableMaintainVisibleContentPosition has already been called, then
       * lets not call it again, unless prop values of mvcp changed.
       *
       * This condition is important since `resetMvcpIfNeeded` gets called in refCallback,
       * which gets called by react on every update to list.
       */
      if (isMvcpEnabled.current && !hasMvcpChanged) {
        return;
      }
      autoscrollToTopThreshold.current = propAutoscrollToTopThreshold;
      minIndexForVisible.current = propMinIndexForVisible;

      isMvcpEnabled.current = true;
      disableMvcp().then(enableMvcpWithRetries);
    };

    const refCallback: (instance: FlatList<T> | null) => void = (ref) => {
      flRef.current = ref;

      resetMvcpIfNeeded();
      if (typeof forwardedRef === 'function') {
        forwardedRef(ref);
      } else if (forwardedRef) {
        forwardedRef.current = ref;
      }
    };

    useEffect(() => {
      // disable before unmounting
      return () => {
        disableMvcp();
      };
    }, []);

    return <FlatList<T> {...props} ref={refCallback} />;
  }
) as unknown) as typeof FlatList;

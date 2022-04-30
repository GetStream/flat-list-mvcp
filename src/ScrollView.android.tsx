import React, { MutableRefObject, useEffect, useRef } from 'react';
import {
  NativeModules,
  Platform,
  ScrollView,
  ScrollViewProps,
} from 'react-native';

export const ScrollViewManager = NativeModules.MvcpScrollViewManager;

export default React.forwardRef(
  (
    props: ScrollViewProps,
    forwardedRef:
      | ((instance: ScrollView | null) => void)
      | MutableRefObject<ScrollView | null>
      | null
  ) => {
    const flRef = useRef<ScrollView | null>(null);
    const isMvcpEnabledNative = useRef<boolean>(false);
    const handle = useRef<number | null>(null);
    const enableMvcpRetriesCount = useRef<number>(0);
    const isMvcpPropPresentRef = useRef(!!props.maintainVisibleContentPosition);

    const autoscrollToTopThreshold = useRef<number | null>(
      props.maintainVisibleContentPosition?.autoscrollToTopThreshold ||
        -Number.MAX_SAFE_INTEGER
    );
    const minIndexForVisible = useRef<number>(
      props.maintainVisibleContentPosition?.minIndexForVisible || 1
    );
    const retryTimeoutId = useRef<NodeJS.Timeout>();
    const debounceTimeoutId = useRef<NodeJS.Timeout>();
    const disableMvcpRef = useRef(async () => {
      isMvcpEnabledNative.current = false;
      if (!handle?.current) {
        return;
      }
      await ScrollViewManager.disableMaintainVisibleContentPosition(
        handle.current
      );
    });
    const enableMvcpWithRetriesRef = useRef(() => {
      // debounce to wait till consecutive mvcp enabling
      // this ensures that always previous handles are disabled first
      if (debounceTimeoutId.current) {
        clearTimeout(debounceTimeoutId.current);
      }
      debounceTimeoutId.current = setTimeout(async () => {
        // disable any previous enabled handles
        await disableMvcpRef.current();

        if (
          !flRef.current ||
          !isMvcpPropPresentRef.current ||
          isMvcpEnabledNative.current ||
          Platform.OS !== 'android'
        ) {
          return;
        }
        const scrollableNode = flRef.current.getScrollableNode();

        try {
          const _handle: number = await ScrollViewManager.enableMaintainVisibleContentPosition(
            scrollableNode,
            autoscrollToTopThreshold.current,
            minIndexForVisible.current
          );
          handle.current = _handle;
        } catch (error: any) {
          /**
           * enableMaintainVisibleContentPosition from native module may throw IllegalViewOperationException,
           * in case view is not ready yet. In that case, lets do a retry!! (max of 10 tries)
           */
          if (enableMvcpRetriesCount.current < 10) {
            retryTimeoutId.current = setTimeout(
              enableMvcpWithRetriesRef.current,
              100
            );
            enableMvcpRetriesCount.current += 1;
          }
        }
      }, 300);
    });

    useEffect(() => {
      // when the mvcp prop changes
      // enable natively again, if the prop has changed
      const propAutoscrollToTopThreshold =
        props.maintainVisibleContentPosition?.autoscrollToTopThreshold ||
        -Number.MAX_SAFE_INTEGER;
      const propMinIndexForVisible =
        props.maintainVisibleContentPosition?.minIndexForVisible || 1;
      const hasMvcpChanged =
        autoscrollToTopThreshold.current !== propAutoscrollToTopThreshold ||
        minIndexForVisible.current !== propMinIndexForVisible ||
        isMvcpPropPresentRef.current !== !!props.maintainVisibleContentPosition;

      if (hasMvcpChanged) {
        enableMvcpRetriesCount.current = 0;
        autoscrollToTopThreshold.current = propAutoscrollToTopThreshold;
        minIndexForVisible.current = propMinIndexForVisible;
        isMvcpPropPresentRef.current = !!props.maintainVisibleContentPosition;
        enableMvcpWithRetriesRef.current();
      }
    }, [props.maintainVisibleContentPosition]);

    const refCallback = useRef<(instance: ScrollView | null) => void>((ref) => {
      flRef.current = ref;
      enableMvcpWithRetriesRef.current();
      if (typeof forwardedRef === 'function') {
        forwardedRef(ref);
      } else if (forwardedRef) {
        forwardedRef.current = ref;
      }
    }).current;

    useEffect(() => {
      const disableMvcp = disableMvcpRef.current;
      return () => {
        // clean up the retry mechanism
        if (debounceTimeoutId.current) {
          clearTimeout(debounceTimeoutId.current);
        }
        // clean up any debounce
        if (debounceTimeoutId.current) {
          clearTimeout(debounceTimeoutId.current);
        }
        disableMvcp();
      };
    }, []);

    return <ScrollView {...props} ref={refCallback} />;
  }
);

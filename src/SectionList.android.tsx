import React, { MutableRefObject, useEffect, useRef } from 'react';
import {
  DefaultSectionT,
  NativeModules,
  Platform,
  SectionList as RNSectionList,
  SectionListProps as RNSectionListProps,
} from 'react-native';

export const ScrollViewManager = NativeModules.MvcpScrollViewManager;

export default React.forwardRef(
  <ItemT extends any, SectionT = DefaultSectionT>(
    props: RNSectionListProps<ItemT, SectionT>,
    forwardedRef:
      | ((instance: RNSectionList<ItemT, SectionT> | null) => void)
      | MutableRefObject<RNSectionList<ItemT, SectionT> | null>
      | null
  ) => {
    const sectionListRef = useRef<RNSectionList<ItemT, SectionT> | null>(null);
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
          !sectionListRef.current ||
          !isMvcpPropPresentRef.current ||
          isMvcpEnabledNative.current ||
          Platform.OS !== 'android'
        ) {
          return;
        }
        const scrollableNode = sectionListRef.current.getScrollableNode();

        try {
          handle.current = await ScrollViewManager.enableMaintainVisibleContentPosition(
            scrollableNode,
            autoscrollToTopThreshold.current,
            minIndexForVisible.current
          );
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

    const refCallback = useRef<
      (instance: RNSectionList<ItemT, SectionT>) => void
    >((ref) => {
      sectionListRef.current = ref;
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

    return <RNSectionList<ItemT, SectionT> ref={refCallback} {...props} />;
  }
);

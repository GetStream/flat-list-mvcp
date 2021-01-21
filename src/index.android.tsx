import React, { useEffect, useRef } from 'react';
import {
  NativeModules,
  FlatList,
  FlatListProps,
  Platform,
  findNodeHandle,
  ScrollViewProps,
  ScrollView,
} from 'react-native';

export const MvcpScrollViewManager = NativeModules.MvcpScrollViewManager;

export type maintainVisibleContentPositionPropType = {
  autoscrollToTopThreshold?: number;
  minIndexForVisible: number;
};

export type FlatListComponentPropType<T = any> = FlatListProps<T> & {
  maintainVisibleContentPosition: maintainVisibleContentPositionPropType;
};

export type ScrollViewComponentPropType = ScrollViewProps & {
  maintainVisibleContentPosition: maintainVisibleContentPositionPropType;
};

const FlatListComponent = React.forwardRef(
  (props: FlatListComponentPropType, forwardedRef) => {
    const flRef = useRef<FlatList>(null);

    const { extraData, maintainVisibleContentPosition: mvcp } = props;
    const autoscrollToTopThreshold = useRef<number>();
    const minIndexForVisible = useRef<number>();

    useEffect(() => {
      let cleanupPromise: Promise<number> | undefined;
      const enableMaintainVisibleContentPosition = (): void => {
        if (!mvcp || Platform.OS !== 'android') return;

        if (
          autoscrollToTopThreshold.current === mvcp.autoscrollToTopThreshold &&
          minIndexForVisible.current === mvcp.minIndexForVisible
        ) {
          // Don't do anythinig if the values haven't changed
          return;
        }

        autoscrollToTopThreshold.current =
          mvcp.autoscrollToTopThreshold || -Number.MAX_SAFE_INTEGER;
        minIndexForVisible.current = mvcp.minIndexForVisible || 0;

        if (flRef.current) {
          const viewTag = findNodeHandle(flRef.current);
          cleanupPromise = MvcpScrollViewManager.enableMaintainVisibleContentPosition(
            viewTag,
            autoscrollToTopThreshold.current,
            minIndexForVisible.current
          );
        }
      };

      enableMaintainVisibleContentPosition();

      return () => {
        if (
          autoscrollToTopThreshold.current === mvcp.autoscrollToTopThreshold &&
          minIndexForVisible.current === mvcp.minIndexForVisible
        ) {
          // Don't do anythinig if the values haven't changed
          return;
        }

        cleanupPromise?.then((handle) => {
          MvcpScrollViewManager.disableMaintainVisibleContentPosition(handle);
        });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [extraData, mvcp]);

    return (
      <FlatList
        {...props}
        ref={(ref) => {
          // @ts-ignore
          flRef.current = ref;
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

const ScrollViewComponent = React.forwardRef(
  (props: ScrollViewComponentPropType, forwardedRef) => {
    const flRef = useRef<FlatList>(null);

    const { maintainVisibleContentPosition: mvcp } = props;
    const autoscrollToTopThreshold = useRef<number>();
    const minIndexForVisible = useRef<number>();

    useEffect(() => {
      let cleanupPromise: Promise<number> | undefined;
      const enableMaintainVisibleContentPosition = (): void => {
        if (!mvcp || Platform.OS !== 'android') return;

        if (
          autoscrollToTopThreshold.current === mvcp.autoscrollToTopThreshold &&
          minIndexForVisible.current === mvcp.minIndexForVisible
        ) {
          // Don't do anythinig if the values haven't changed
          return;
        }

        autoscrollToTopThreshold.current =
          mvcp.autoscrollToTopThreshold || -Number.MAX_SAFE_INTEGER;
        minIndexForVisible.current = mvcp.minIndexForVisible || 0;

        if (flRef.current) {
          const viewTag = findNodeHandle(flRef.current);
          cleanupPromise = MvcpScrollViewManager.enableMaintainVisibleContentPosition(
            viewTag,
            autoscrollToTopThreshold.current,
            minIndexForVisible.current
          );
        }
      };

      enableMaintainVisibleContentPosition();

      return () => {
        if (
          autoscrollToTopThreshold.current === mvcp.autoscrollToTopThreshold &&
          minIndexForVisible.current === mvcp.minIndexForVisible
        ) {
          // Don't do anythinig if the values haven't changed
          return;
        }

        cleanupPromise?.then((handle) => {
          MvcpScrollViewManager.disableMaintainVisibleContentPosition(handle);
        });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mvcp]);

    return (
      <ScrollView
        {...props}
        ref={(ref) => {
          // @ts-ignore
          flRef.current = ref;
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

export { FlatListComponent as FlatList };
export { ScrollViewComponent as ScrollView };

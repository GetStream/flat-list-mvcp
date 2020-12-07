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

export type maintainVisibleContentPositionPropType = null | {
  autoscrollToTopThreshold?: number | null;
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
    const { extraData, maintainVisibleContentPosition } = props;

    useEffect(() => {
      let cleanupPromise: Promise<number> | undefined;
      if (
        flRef.current &&
        Platform.OS === 'android' &&
        maintainVisibleContentPosition
      ) {
        const mvcp = {
          autoscrollToTopThreshold: 0,
          ...maintainVisibleContentPosition,
        };

        const viewTag = findNodeHandle(flRef.current);
        cleanupPromise = MvcpScrollViewManager.enableMaintainVisibleContentPosition(
          viewTag,
          mvcp.autoscrollToTopThreshold,
          mvcp.minIndexForVisible
        );
      }

      return () => {
        cleanupPromise?.then((handle) => {
          MvcpScrollViewManager.disableMaintainVisibleContentPosition(handle);
        });
      };
    }, [flRef, extraData, maintainVisibleContentPosition]);

    return (
      <FlatList
        {...props}
        ref={(ref) => {
          // @ts-ignore
          flRef.current = ref;
          typeof forwardedRef === 'function' && forwardedRef(ref);
        }}
      />
    );
  }
);

const ScrollViewComponent = React.forwardRef(
  (props: ScrollViewComponentPropType, forwardedRef) => {
    const svRef = useRef<ScrollView>(null);
    const { maintainVisibleContentPosition } = props;

    useEffect(() => {
      let cleanupPromise: Promise<number> | undefined;
      if (
        svRef.current &&
        Platform.OS === 'android' &&
        maintainVisibleContentPosition
      ) {
        const mvcp = {
          autoscrollToTopThreshold: 0,
          ...maintainVisibleContentPosition,
        };

        const viewTag = findNodeHandle(svRef.current);
        cleanupPromise = MvcpScrollViewManager.enableMaintainVisibleContentPosition(
          viewTag,
          mvcp.autoscrollToTopThreshold,
          mvcp.minIndexForVisible
        );
      }

      return () => {
        cleanupPromise?.then((handle) => {
          MvcpScrollViewManager.disableMaintainVisibleContentPosition(handle);
        });
      };
    }, [svRef, maintainVisibleContentPosition]);

    return (
      <ScrollView
        {...props}
        ref={(ref) => {
          // @ts-ignore
          svRef.current = ref;
          typeof forwardedRef === 'function' && forwardedRef(ref);
        }}
      />
    );
  }
);

export { FlatListComponent as FlatList };
export { ScrollViewComponent as ScrollView };

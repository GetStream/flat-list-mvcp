import React, { useEffect } from 'react';
import {
  FlatList,
  ScrollView,
  NativeModules,
  FlatListProps,
  Platform,
  findNodeHandle,
  ScrollViewProps,
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
  (props: FlatListComponentPropType, forwardedRef: any) => {
    const flRef = forwardedRef;
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
          minIndexForVisible: 0,
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
        ref={forwardedRef}
      />
    );
  }
);

const ScrollViewComponent = React.forwardRef(
  (props: ScrollViewComponentPropType, forwardedRef: any) => {
    const svRef = forwardedRef;
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
        ref={forwardedRef}
      />
    );
  }
);

export { FlatListComponent as FlatList };
export { ScrollViewComponent as ScrollView };

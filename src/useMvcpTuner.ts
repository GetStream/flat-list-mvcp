import { MutableRefObject, useEffect, useRef } from 'react';
import {
  NativeModules,
  FlatList,
  Platform,
  findNodeHandle,
} from 'react-native';

export type maintainVisibleContentPositionPropType = {
  autoscrollToTopThreshold?: number | null;
  minIndexForVisible: number;
};

export const MvcpScrollViewManager = NativeModules.MvcpScrollViewManager;

export const useMvcpTuner = (
  flRef: MutableRefObject<FlatList | undefined>,
  refReady: boolean,
  mvcp?: maintainVisibleContentPositionPropType,
  extraData?: any
) => {
  const autoscrollToTopThreshold = useRef<number>();
  const minIndexForVisible = useRef<number>();

  useEffect(() => {
    let cleanupPromise: Promise<number> | undefined;
    const enableMaintainVisibleContentPosition = (): void => {
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

      autoscrollToTopThreshold.current =
        mvcp.autoscrollToTopThreshold || -Number.MAX_SAFE_INTEGER;
      minIndexForVisible.current = mvcp.minIndexForVisible || 0;

      const viewTag = findNodeHandle(flRef.current);
      cleanupPromise = MvcpScrollViewManager.enableMaintainVisibleContentPosition(
        viewTag,
        autoscrollToTopThreshold.current,
        minIndexForVisible.current
      );
    };

    enableMaintainVisibleContentPosition();

    return () => {
      if (
        mvcp &&
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
  }, [refReady, extraData, mvcp]);
};

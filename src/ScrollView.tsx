import React, { useState, useRef } from 'react';
import {
  NativeModules,
  FlatList,
  ScrollViewProps,
  ScrollView,
} from 'react-native';
import { useMvcpTuner } from './useMvcpTuner';

export const MvcpScrollViewManager = NativeModules.MvcpScrollViewManager;

export type maintainVisibleContentPositionPropType = {
  autoscrollToTopThreshold?: number;
  minIndexForVisible: number;
};

export type ScrollViewComponentPropType = ScrollViewProps & {
  maintainVisibleContentPosition: maintainVisibleContentPositionPropType;
};

export default React.forwardRef(
  (props: ScrollViewComponentPropType, forwardedRef) => {
    const flRef = useRef<FlatList>();
    const [refReady, setRefReady] = useState(false);

    const { maintainVisibleContentPosition: mvcp } = props;
    useMvcpTuner(flRef, refReady, mvcp);

    return (
      <ScrollView
        {...props}
        ref={(ref) => {
          // @ts-ignore
          flRef.current = ref;
          setRefReady(true);

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

import React, { useRef, useState } from 'react';
import { FlatList, FlatListProps } from 'react-native';
import { useMvcpTuner } from './useMvcpTuner';

export type maintainVisibleContentPositionPropType = {
  autoscrollToTopThreshold?: number;
  minIndexForVisible: number;
};

export type FlatListComponentPropType<T = any> = FlatListProps<T> & {
  maintainVisibleContentPosition: maintainVisibleContentPositionPropType;
};

export default React.forwardRef(
  (props: FlatListComponentPropType, forwardedRef) => {
    const flRef = useRef<FlatList>();
    const [refReady, setRefReady] = useState(false);
    const { extraData, maintainVisibleContentPosition: mvcp } = props;
    useMvcpTuner(flRef, refReady, mvcp, extraData);

    return (
      <FlatList
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

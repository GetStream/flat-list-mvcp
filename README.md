# `maintainVisibleContentPosition` prop support for Android react-native.

In react-native, [ScrollView](https://reactnative.dev/docs/scrollview) (and [FlatList](https://reactnative.dev/docs/flatlist)) component have support for a prop [`maintainVisibleContentPosition`](https://reactnative.dev/docs/scrollview#maintainvisiblecontentposition), which is really useful for chat-like applications where you want to see new messages scroll into place. Although currently its only supported on iOS. So here we have built a simple wrapper for FlatList and ScrollView to add support for this prop for android.  On iOS, we simply return FlatList and ScrollView from react-native package.

**Credits**: [stackia](https://github.com/stackia) for https://github.com/facebook/react-native/pull/29466#issuecomment-664367382

We built this wrapper for our in-house project, but we are making it public, in case it helps other devs from react-native community.

## Installation

```sh
yarn add maintained-content-visible-position-flat-list
```

## Usage

```js
import { FlatList, ScrollView } from 'maintained-content-visible-position-flat-list';

<FlatList
    maintainVisibleContentPosition={{
        autoscrollToTopThreshold: 10,
        minIndexForVisible: 1,
    }}
    ...
/>

<ScrollView
    maintainVisibleContentPosition={{
        autoscrollToTopThreshold: 10,
        minIndexForVisible: 1,
    }}
>

```

## Contributing

PRs for improvement are welcome :) 
## License

MIT

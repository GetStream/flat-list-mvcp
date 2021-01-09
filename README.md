# `maintainVisibleContentPosition` prop support for Android react-native.

In react-native, [ScrollView](https://reactnative.dev/docs/scrollview) (and [FlatList](https://reactnative.dev/docs/flatlist)) component have support for a prop [`maintainVisibleContentPosition`](https://reactnative.dev/docs/scrollview#maintainvisiblecontentposition), which is really useful for chat-like applications where you want to see new messages scroll into place. Also you might need it in other applications where you need bi-directional infinite scroll. Although currently its only supported on iOS. So here we have built a simple wrapper for FlatList and ScrollView to add support for this prop for android.  On iOS, we simply return FlatList and ScrollView from react-native package.

We built this wrapper for our in-house [react-native chat sdk](https://github.com/GetStream/stream-chat-react-native), but we are making it public, in case it helps other devs from react-native community.

**Credits**: Thanks to [stackia](https://github.com/stackia) for https://github.com/facebook/react-native/pull/29466#issuecomment-664367382

## Example

```sh
#  clone the repo
git clone https://github.com/GetStream/flat-list-mvcp.git
cd flat-list-mvcp/Example

# Install npm and pod dependencies
yarn; npx pod-install;

# run the app
npx react-native run-android
```
## Installation

```sh
yarn add @stream-io/flat-list-mvcp
```

## Usage

```js
import { FlatList, ScrollView } from '@stream-io/flat-list-mvcp';

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
    ...
/>

```

## Contributing

PRs for improvement are welcome :) 
## License

MIT

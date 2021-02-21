import type * as ios from './index.ios';
import type * as android from './index.android';

/**
 * This checks that the types of Android and iOS are the same to ensure the types match,
 * currently Android is cast to standard RN types so they should
 */
declare var _test: typeof ios;
declare var _test: typeof android;

export * from './index.ios';

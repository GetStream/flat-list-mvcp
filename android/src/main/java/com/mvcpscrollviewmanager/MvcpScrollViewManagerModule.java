package com.mvcpscrollviewmanager;

import android.view.View;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.UIManagerModuleListener;
import com.facebook.react.views.scroll.ReactScrollView;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.HashMap;

/**
 * Holds the required values for layoutUpdateListener.
 */
class ScrollViewUIHolders {
  static int prevFirstVisibleTop = 0;
  static View firstVisibleView = null;
  static int currentScrollY = 0;
}

public class MvcpScrollViewManagerModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;
  private HashMap<Integer, UIManagerModuleListener> uiManagerModuleListeners;

  MvcpScrollViewManagerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "MvcpScrollViewManager";
  }

  @Override
  public void initialize() {
    super.initialize();
    this.uiManagerModuleListeners = new HashMap<>();
  }

  @ReactMethod
  public void enableMaintainVisibleContentPosition(final int viewTag, final int autoscrollToTopThreshold, final int minIndexForVisible, final Promise promise) {
    final UIManagerModule uiManagerModule = this.reactContext.getNativeModule(UIManagerModule.class);
    this.reactContext.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        try {
          final ReactScrollView scrollView = (ReactScrollView)uiManagerModule.resolveView(viewTag);
          final UIManagerModuleListener uiManagerModuleListener = new UIManagerModuleListener() {
            @Override
            public void willDispatchViewUpdates(final UIManagerModule uiManagerModule) {
              uiManagerModule.prependUIBlock(new UIBlock() {
                @Override
                public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
                  ReactViewGroup mContentView = (ReactViewGroup)scrollView.getChildAt(0);
                  if (mContentView == null) return;

                  ScrollViewUIHolders.currentScrollY = scrollView.getScrollY();

                  for (int ii = minIndexForVisible; ii < mContentView.getChildCount(); ++ii) {
                    View subview = mContentView.getChildAt(ii);
                    if (subview.getTop() >= ScrollViewUIHolders.currentScrollY) {
                      ScrollViewUIHolders.prevFirstVisibleTop = subview.getTop();
                      ScrollViewUIHolders.firstVisibleView = subview;
                      break;
                    }
                  }
                }
              });
            }
          };

          UIImplementation.LayoutUpdateListener layoutUpdateListener = new UIImplementation.LayoutUpdateListener() {
            @Override
            public void onLayoutUpdated(ReactShadowNode root) {
              if (ScrollViewUIHolders.firstVisibleView == null) return;

              int deltaY = ScrollViewUIHolders.firstVisibleView.getTop() - ScrollViewUIHolders.prevFirstVisibleTop;


              if (Math.abs(deltaY) > 1) {
                boolean isWithinThreshold = ScrollViewUIHolders.currentScrollY <= autoscrollToTopThreshold;
                scrollView.setScrollY(ScrollViewUIHolders.currentScrollY + deltaY);

                // If the offset WAS within the threshold of the start, animate to the start.
                if (isWithinThreshold) {
                  scrollView.smoothScrollTo(scrollView.getScrollX(), 0);
                }
              }
            }
          };

          uiManagerModule.getUIImplementation().setLayoutUpdateListener(layoutUpdateListener);
          uiManagerModule.addUIManagerListener(uiManagerModuleListener);
          int key = uiManagerModuleListeners.size() + 1;
          uiManagerModuleListeners.put(key, uiManagerModuleListener);
          promise.resolve(key);
        } catch(IllegalViewOperationException e) {
          promise.reject(e);
        }
      }
    });
  }

  @ReactMethod
  public void disableMaintainVisibleContentPosition(int key, Promise promise) {
    try {
      if (key >= 0) {
        final UIManagerModule uiManagerModule = this.reactContext.getNativeModule(UIManagerModule.class);
        uiManagerModule.removeUIManagerListener(uiManagerModuleListeners.remove(key));
        uiManagerModule.getUIImplementation().removeLayoutUpdateListener();
      }
      promise.resolve(null);
    } catch (Exception e) {
      promise.resolve(-1);
    }
  }
}

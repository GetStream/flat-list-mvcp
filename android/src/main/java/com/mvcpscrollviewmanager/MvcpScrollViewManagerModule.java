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
import java.util.Iterator;
import java.util.Map;


public class MvcpScrollViewManagerModule extends ReactContextBaseJavaModule {
  private HashMap<Integer, UIManagerModuleListener> uiManagerModuleListeners; // rnHandle <-> UIManagerModuleListener
  private HashMap<Integer, ScrollViewUIHolder> scrollViewUIHolders; // viewTag <-> ScrollViewUIHolder

  MvcpScrollViewManagerModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "MvcpScrollViewManager";
  }

  @Override
  public void initialize() {
    super.initialize();
    this.uiManagerModuleListeners = new HashMap<>();
    this.scrollViewUIHolders = new HashMap<>();
  }

  private ScrollViewUIHolder getScrollViewUiHolderByViewTag(int viewTag) {
    ScrollViewUIHolder scrollViewUIHolder = scrollViewUIHolders.get(viewTag);
    if (scrollViewUIHolder == null) {
      scrollViewUIHolder = new ScrollViewUIHolder();
      scrollViewUIHolders.put(viewTag, scrollViewUIHolder);
    }
    return scrollViewUIHolder;
  }

  private void removeScrollViewUiHolderByRNHandle(int rnHandle) {
    Iterator<ScrollViewUIHolder> iterator = scrollViewUIHolders.values().iterator();
    while (iterator.hasNext()) {
      ScrollViewUIHolder scrollViewUIHolder = iterator.next();
      if (scrollViewUIHolder.getRnHandle() == rnHandle) {
        iterator.remove();
        return;
      }
    }
  }

  @ReactMethod
  public void enableMaintainVisibleContentPosition(final int viewTag, final int autoscrollToTopThreshold, final int minIndexForVisible, final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        final UIManagerModule uiManagerModule = getReactApplicationContext().getNativeModule(UIManagerModule.class);
        if (uiManagerModule == null) return;
        ScrollViewUIHolder scrollViewUIHolder = getScrollViewUiHolderByViewTag(viewTag);
        try {
          final UIManagerModuleListener uiManagerModuleListener = new UIManagerModuleListener() {
            @Override
            public void willDispatchViewUpdates(final UIManagerModule uiManagerModule) {
              uiManagerModule.prependUIBlock(new UIBlock() {
                @Override
                public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
                  ReactScrollView scrollView = null;
                  try {
                    scrollView = (ReactScrollView) uiManagerModule.resolveView(viewTag);
                  } catch (IllegalViewOperationException ignored) {
                  }
                  if (scrollView == null) return;
                  ReactViewGroup mContentView = (ReactViewGroup) scrollView.getChildAt(0);
                  if (mContentView == null) return;
                  int scrollY = scrollView.getScrollY();
                  scrollViewUIHolder.setCurrentScrollY(scrollY);

                  for (int ii = minIndexForVisible; ii < mContentView.getChildCount(); ++ii) {
                    View subview = mContentView.getChildAt(ii);
                    if (subview.getTop() >= scrollY) {
                      scrollViewUIHolder.setPrevFirstVisibleTop(subview.getTop());
                      scrollViewUIHolder.setFirstVisibleView(subview);
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
              for (Map.Entry<Integer, ScrollViewUIHolder> entry : scrollViewUIHolders.entrySet()) {
                ReactScrollView scrollView = null;
                Integer viewTag = entry.getKey();
                try {
                  scrollView = (ReactScrollView) uiManagerModule.resolveView(viewTag);
                } catch (IllegalViewOperationException ignored) {
                }
                if (scrollView == null) {
                  continue;
                }
                ScrollViewUIHolder scrollViewUIHolder = entry.getValue();
                View firstVisibleView = scrollViewUIHolder.getFirstVisibleView();
                if (firstVisibleView == null) {
                  continue;
                }
                int deltaY = firstVisibleView.getTop() - scrollViewUIHolder.getPrevFirstVisibleTop();
                if (Math.abs(deltaY) > 1) {
                  int currentScrollY = scrollViewUIHolder.getCurrentScrollY();
                  boolean isWithinThreshold = currentScrollY <= autoscrollToTopThreshold;
                  scrollView.setScrollY(currentScrollY + deltaY);
                  // If the offset WAS within the threshold of the start, animate to the start.
                  if (isWithinThreshold) {
                    scrollView.smoothScrollTo(scrollView.getScrollX(), 0);
                  }
                }
              }
            }
          };
          uiManagerModule.addUIManagerListener(uiManagerModuleListener);
          uiManagerModule.getUIImplementation().setLayoutUpdateListener(layoutUpdateListener);

          int rnHandle = uiManagerModuleListeners.size() + 1;
          uiManagerModuleListeners.put(rnHandle, uiManagerModuleListener);
          scrollViewUIHolder.setRnHandle(rnHandle);
          promise.resolve(rnHandle);
        } catch (IllegalViewOperationException e) {
          promise.reject(e);
        }
      }
    });
  }

  @ReactMethod
  public void disableMaintainVisibleContentPosition(int rnHandle, Promise promise) {
    try {
      if (rnHandle >= 0) {
        final UIManagerModule uiManagerModule = getReactApplicationContext().getNativeModule(UIManagerModule.class);
        if (uiManagerModule != null) {
          // adding to ui block ensures that the underlying callback executes after all view updates are dispatched
          uiManagerModule.addUIBlock(new UIBlock() {
            @Override
            public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
              UIManagerModuleListener listener = uiManagerModuleListeners.remove(rnHandle);
              uiManagerModule.removeUIManagerListener(listener);
              // when all listeners have been removed, remove the layout listener
              if (uiManagerModuleListeners.size() == 0) {
                uiManagerModule.getUIImplementation().removeLayoutUpdateListener();
              }
              removeScrollViewUiHolderByRNHandle(rnHandle);
            }
          });
        }
      }
      promise.resolve(null);
    } catch (Exception e) {
      promise.resolve(-1);
    }
  }
}

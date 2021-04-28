package com.mvcpscrollviewmanager;

import android.os.Build;
import android.view.View;

import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.UIManagerModuleListener;
import com.facebook.react.views.scroll.ReactScrollView;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;


public class MvcpScrollViewManagerModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;
  private HashMap<Integer, UIManagerModuleListener> uiManagerModuleListeners;
  private final List<ScrollViewUIHolders> uiHolderList = new ArrayList<>();


  MvcpScrollViewManagerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  private ScrollViewUIHolders getScrollViewUiHolder(int viewTag) {
    for (int i = 0; i < uiHolderList.size(); i++) {
      if (uiHolderList.get(i).getViewTag() == viewTag) {
        return uiHolderList.get(i);
      }
    }
    return null;
  }

  /**
   * Removes ScrollViewHolder from the tracking list
   *
   * @param key
   */
  private void removeScrollViewUiHolder(int key) {
    for (Iterator<ScrollViewUIHolders> iterator = uiHolderList.iterator(); iterator.hasNext(); ) {
      ScrollViewUIHolders holder = iterator.next();
      if (holder.getKey() == key) {
        iterator.remove();
        break;
      }
    }

  }

  /**
   * Adds a new ScrollViewHolders to the holders List if not already added
   *
   * @param newUiHolder
   */
  private void addScrollViewHolder(ScrollViewUIHolders newUiHolder) {
    if (!uiHolderList.contains(newUiHolder)) {
      uiHolderList.add(newUiHolder);
    }
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
    addScrollViewHolder(new ScrollViewUIHolders(viewTag));
    try {
      final UIManagerModuleListener uiManagerModuleListener = new UIManagerModuleListener() {
        @Override
        public void willDispatchViewUpdates(final UIManagerModule uiManagerModule) {
          uiManagerModule.prependUIBlock(new UIBlock() {
            @Override
            public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
              ReactScrollView scrollView = (ReactScrollView) uiManagerModule.resolveView(viewTag);
              ReactViewGroup mContentView = (ReactViewGroup) scrollView.getChildAt(0);
              ScrollViewUIHolders uiHolder = getScrollViewUiHolder(viewTag);

              if (mContentView == null || uiHolder == null) return;

              uiHolder.setCurrentScrollY(scrollView.getScrollY());

              for (int ii = minIndexForVisible; ii < mContentView.getChildCount(); ++ii) {
                View subview = mContentView.getChildAt(ii);
                if (subview.getTop() >= uiHolder.getCurrentScrollY()) {
                  uiHolder.setPrevFirstVisibleTop(subview.getTop());
                  uiHolder.setFirstVisibleView(subview);
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
          //Update each ScrollViewHolder if necessary
          for (ScrollViewUIHolders uiHolder : uiHolderList) {
            ReactScrollView scrollView = (ReactScrollView) uiManagerModule.resolveView(uiHolder.getViewTag());
            if (uiHolder.getFirstVisibleView() == null)
              return;

            int deltaY = uiHolder.getFirstVisibleView().getTop() - uiHolder.getPrevFirstVisibleTop();

            if (Math.abs(deltaY) > 1) {
              boolean isWithinThreshold = uiHolder.getCurrentScrollY() <= autoscrollToTopThreshold;
              scrollView.setScrollY(uiHolder.getCurrentScrollY() + deltaY);

              // If the offset WAS within the threshold of the start, animate to the start.
              if (isWithinThreshold) {
                scrollView.smoothScrollTo(scrollView.getScrollX(), 0);
              }
            }
          }
        }
      };
      uiManagerModule.getUIImplementation().setLayoutUpdateListener(layoutUpdateListener);
      uiManagerModule.addUIManagerListener(uiManagerModuleListener);
      int key = uiManagerModuleListeners.size() + 1;
      uiManagerModuleListeners.put(key, uiManagerModuleListener);
      ScrollViewUIHolders uiHolder = getScrollViewUiHolder(viewTag);
      if (uiHolder != null) {
        uiHolder.setKey(key);
      }
      promise.resolve(key);
    } catch (IllegalViewOperationException e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void disableMaintainVisibleContentPosition(int key, Promise promise) {
    try {
      if (key >= 0) {
        final UIManagerModule uiManagerModule = this.reactContext.getNativeModule(UIManagerModule.class);
        uiManagerModule.removeUIManagerListener(uiManagerModuleListeners.remove(key));
        // only remove the layout listener when there are no more ui module listeners
        if (uiManagerModuleListeners.size() == 0) {
          uiManagerModule.getUIImplementation().removeLayoutUpdateListener();
        }
        removeScrollViewUiHolder(key);
      }
      promise.resolve(null);
    } catch (Exception e) {
      promise.resolve(-1);
    }
  }
}

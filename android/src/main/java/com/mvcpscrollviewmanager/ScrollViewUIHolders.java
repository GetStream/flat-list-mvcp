package com.mvcpscrollviewmanager;

import android.view.View;

public class ScrollViewUIHolders {

  private int prevFirstVisibleTop = 0;
  private View firstVisibleView = null;
  private int currentScrollY = 0;
  private int viewTag = 0;
  private int key = 0;

  ScrollViewUIHolders(int viewTag) {
    this.viewTag = viewTag;
  }

  public int getPrevFirstVisibleTop() {
    return prevFirstVisibleTop;
  }

  public void setPrevFirstVisibleTop(int prevFirstVisibleTop) {
    this.prevFirstVisibleTop = prevFirstVisibleTop;
  }

  public View getFirstVisibleView() {
    return firstVisibleView;
  }

  public void setFirstVisibleView(View firstVisibleView) {
    this.firstVisibleView = firstVisibleView;
  }

  public int getCurrentScrollY() {
    return currentScrollY;
  }

  public void setCurrentScrollY(int currentScrollY) {
    this.currentScrollY = currentScrollY;
  }

  public int getViewTag() {
    return viewTag;
  }

  public void setKey(int key) {
    this.key = key;
  }

  public int getKey() {
    return key;
  }

  @Override
  public boolean equals(Object o) {
    if (o == this)
      return true;
    if (!(o instanceof ScrollViewUIHolders))
      return false;
    ScrollViewUIHolders other = (ScrollViewUIHolders) o;
    return this.viewTag == other.viewTag;
  }

}

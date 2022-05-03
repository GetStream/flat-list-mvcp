package com.mvcpscrollviewmanager;

import android.view.View;

public class ScrollViewUIHolder {
  private int prevFirstVisibleTop = 0;
  private View firstVisibleView;
  private int currentScrollY = 0;
  private int rnHandle = 0;

  public int getRnHandle() {
    return rnHandle;
  }

  public void setRnHandle(int rnHandle) {
    this.rnHandle = rnHandle;
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

}

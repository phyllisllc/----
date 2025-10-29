// app.js
// 添加全局__route__变量以避免渲染层错误
if (typeof __route__ === 'undefined') {
  // 在全局作用域中定义__route__
  global.__route__ = '';
}

App({
  onLaunch: function() {
    // 小程序启动时执行
    console.log('App Launch');
  },
  onShow: function() {
    // 小程序显示时执行
    console.log('App Show');
  },
  onHide: function() {
    // 小程序隐藏时执行
    console.log('App Hide');
  },
  globalData: {
    userInfo: null
  }
});
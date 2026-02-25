// Background Script

chrome.runtime.onInstalled.addListener(() => {
  console.log('🛡️ 卖家帮插件已安装');
});

// 处理来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    chrome.action.openPopup();
  }
});

// 浏览器图标点击时更新 badge
chrome.action.onClicked.addListener(async (tab) => {
  // 可以在这里添加一些初始化逻辑
});

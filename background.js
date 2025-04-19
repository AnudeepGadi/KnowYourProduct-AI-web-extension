chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab is fully loaded and has a valid URL
  if (changeInfo.status === "complete" && tab.url && tab.url.includes("walmart.com")) {
      chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
      });
  }
});

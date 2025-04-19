// popup.js - Handles popup interaction

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleButton');
  
    chrome.storage.sync.get('chatEnabled', (data) => {
      toggleButton.textContent = data.chatEnabled ? 'Disable Chat' : 'Enable Chat';
    });
  
    toggleButton.addEventListener('click', () => {
      chrome.storage.sync.get('chatEnabled', (data) => {
        const newEnabledState = !data.chatEnabled;
        chrome.storage.sync.set({ chatEnabled: newEnabledState }, () => {
          toggleButton.textContent = newEnabledState ? 'Disable Chat' : 'Enable Chat';
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleChat', enabled: newEnabledState });
          });
        });
      });
    });
  });
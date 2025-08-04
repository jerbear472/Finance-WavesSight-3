// Background script - handles communication between extension and WaveSight

// Store captured data temporarily
let capturedTrends = [];

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'captureData':
      handleCapture(request.data);
      break;
      
    // Quick submit removed
    case 'getCapturedTrends':
      sendResponse({ trends: capturedTrends });
      break;
      
    case 'clearCaptured':
      capturedTrends = [];
      updateBadge();
      break;
  }
  
  return true; // Keep message channel open
});

// Handle data capture
function handleCapture(data) {
  // Add to captured trends
  capturedTrends.push({
    ...data,
    id: Date.now().toString(),
    captured_at: new Date().toISOString()
  });
  
  // Update badge
  updateBadge();
  
  // Store in local storage
  chrome.storage.local.set({ capturedTrends });
  
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon128.png',
    title: 'Trend Captured!',
    message: `Captured ${data.platform} trend from ${data.creator_handle || 'Unknown'}`,
    buttons: [
      { title: 'View Captured' },
      { title: 'Open WaveSight' }
    ]
  });
}

// Quick submit functionality removed

// Detect category based on content
function detectCategory(data) {
  const caption = (data.post_caption || data.video_title || '').toLowerCase();
  const hashtags = (data.hashtags || []).join(' ').toLowerCase();
  const combined = caption + ' ' + hashtags;
  
  // Simple category detection
  if (combined.includes('dance') || combined.includes('choreography')) {
    return 'visual_style';
  } else if (combined.includes('song') || combined.includes('music') || combined.includes('sound')) {
    return 'audio_music';
  } else if (combined.includes('tutorial') || combined.includes('howto') || combined.includes('diy')) {
    return 'creator_technique';
  } else if (combined.includes('meme') || combined.includes('funny') || combined.includes('viral')) {
    return 'meme_format';
  } else if (combined.includes('product') || combined.includes('review') || combined.includes('haul')) {
    return 'product_brand';
  } else {
    return 'behavior_pattern';
  }
}

// Get auth token from WaveSight
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.cookies.get({
      url: 'http://localhost:3000',
      name: 'wavesight-auth-token'
    }, (cookie) => {
      resolve(cookie ? cookie.value : null);
    });
  });
}

// Update extension badge
function updateBadge() {
  const count = capturedTrends.length;
  
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // View captured trends
    chrome.action.openPopup();
  } else if (buttonIndex === 1) {
    // Submit now or open timeline
    chrome.tabs.create({
      url: 'http://localhost:3000/submit'
    });
  }
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  // Load saved trends
  chrome.storage.local.get(['capturedTrends'], (result) => {
    if (result.capturedTrends) {
      capturedTrends = result.capturedTrends;
      updateBadge();
    }
  });
  
  // Create context menu
  chrome.contextMenus.create({
    id: 'capture-trend',
    title: 'Capture Trend for WaveSight',
    contexts: ['page', 'video', 'image'],
    documentUrlPatterns: [
      '*://*.tiktok.com/*',
      '*://*.instagram.com/*',
      '*://*.youtube.com/*',
      '*://*.twitter.com/*',
      '*://*.x.com/*'
    ]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'capture-trend') {
    // Send message to content script to capture
    chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
  }
});
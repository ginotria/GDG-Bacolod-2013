function sendMessage(data, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        lastTabId = tabs[0].id;
        chrome.tabs.sendMessage(lastTabId, data, callback);
    });
}
// onHistoryStateUpdate Event -> Fired when the frame's history was updated to a new URL.
chrome.webNavigation.onHistoryStateUpdated.addListener(function(data) {
    if (typeof data) {
        sendMessage({
            event: 'onHistoryStateUpdated',
            data: data
        });
    } else {
        console.error('inHandlerError', e);
    }
});

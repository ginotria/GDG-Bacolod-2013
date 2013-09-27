console.log('Hello bacolod');

var Drawer = Marionette.View.extend({
    className: 'drawer show',
    template: '#tpl-drawer'
});
var Extension = {
    init: function() {
        var self = this;
        this.loadHandlebarsTemplates(function() {
            // floating drawer waiting to be attached in file view page
            self.drawer = new Drawer();
            self.drawer.render();

            // initial check if we're on a file view page
            self.checkCurrentPage();

            // set onMessage() as receiver of message from the background page
            chrome.runtime.onMessage.addListener(onMessage);
        });
    },
    loadHandlebarsTemplates: function(callback) {
        var timestamp = new Date().getTime();
        var req = new XMLHttpRequest();
        req.open('GET', chrome.extension.getURL('templates.html?ts=' + timestamp), true);
        req.onreadystatechange = function() {
            if (req.readyState === 4 && req.status === 200) {
                $('body').append(req.responseText); // inject loaded templates
                if (callback) {
                    callback();
                }
            }
            if (req.status === 404) {
                self.track('Failed loading view templates');
            }
        };
        req.send(null);
    },
    checkCurrentPage: function() {

        var url = window.location.href;
        if (url.indexOf('/blob/') > -1 ) {
            // we're on a file view page
            $('body').append(this.drawer.$el);
        } else {
            this.drawer.remove();
        }
    },
};

// receiver of messages from the background page
function onMessage(msg) {
    var ev = msg.event;
    if (ev === 'onHistoryStateUpdated') {
        Extension.checkCurrentPage();
    }
}

Extension.init();

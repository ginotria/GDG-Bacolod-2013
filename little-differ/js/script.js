
console.log('Hello bacolod');

var CommitItemView = Marionette.ItemView.extend({
    template: '#tpl-commit-item',
    tagName: 'li',
    className: "commit commit-differ commit-group-item js-navigation-item js-details-container qtip-link",
    onRender: function() {
        this.setTooltip();
    },

    setTooltip: function() {
        var self = this;
        this.$el.qtip({
            position: {
                my: 'center right', // Position my top left...
                at: 'center left',
                target: this.$el
            },
            content: {
                text: function(ev) {
                    return $(getTemplate('tpl-commit-item-tooltip', self.model.toJSON()));
                }
            },
            events: {
                visible: function (event, api) {
                    var $content = $(api.elements.content);
                    $content.addClass('commit-group-item js-navigation-item js-details-container');
                    self.compareToHead(function(text) {
                        text = diff2Html(text);
                        $content.find('.commit-patch').html($(text));
                    });
                }
            },
            hide: {fixed: true},
            style: {classes: 'ui-tooltip-light ui-tooltip-shadow'}
        });

    },
    compareToHead: function(callback) {
        var url = this.model.get('url').split('/commits')[0], _f = {}, self = this;
        if (this.model.get('patch_diff')) {
            if (callback) {
                callback(this.model.get('patch_diff'));
            }
        } else {
            $.get(url + '/compare/' + this.model.get('sha') + '...' +  this.model.get('parent_sha'), {
                stamp: new Date().getTime()
            }, function(res) {
                _.each(res.files, function(file) {
                    if (file.filename === self.model.get('curr_file')) {
                        self.model.set('patch_diff', file.patch);
                        if (callback) {
                            callback(file.patch);
                        }
                        return;
                    }
                });
            });
        }

    }
});
var CommitListView = Marionette.CollectionView.extend({
    tagName: 'ul',
    className: 'commit-group',
    itemView: CommitItemView
});
var Drawer = Marionette.View.extend({
    className: 'drawer show',
    initialize: function() {
        this.file = {
            repo: '',
            path: '',
            branch: '',
            file_name: ''

        };
        this.commits = new Backbone.Collection();
        this.commitListView = new CommitListView({
            collection: this.commits
        });
        this.$el.append(this.commitListView.render().$el);

        _.bindAll(this, 'onCommitsAdd');
        this.commits.bind('add', this.onCommitsAdd);
    },
    onCommitsAdd: function(commit) {
        commit.set('parent_sha', this.file.branch);
        commit.set('curr_file', this.file.path);
    },
    getFileDetails: function() {
        // get file details
        var url =  window.location.href, file = {};
        file.repo = $('#js-command-bar-field').data().repo;
        file.path = url.split('blob/')[1].substr(url.split('blob/')[1].indexOf('/') + 1);
        file.branch = url.split('blob/')[1].substr(0, url.split('blob/')[1].indexOf('/'));
        file.file_name = $('.final-path').text();
        console.log('file', file);
        return file;

    },
    loadHistory: function() {
        this.file = this.getFileDetails();
        this.commits.reset();
        this.commits.url = 'https://api.github.com/repos/' + this.file.repo + '/commits';
        this.commits.fetch({
            data: {
                path: this.file.path,
                sha: this.file.branch
            }
        });
    }
});
var Extension = {
    TEMPLATES: {},
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
            this.drawer.loadHistory();
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


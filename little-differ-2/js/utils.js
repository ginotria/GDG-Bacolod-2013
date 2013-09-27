Handlebars.registerHelper('breaklines', function(text) {
    text = Handlebars.Utils.escapeExpression(text);
    text = text.toString();
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    return new Handlebars.SafeString(text);
});

Handlebars.registerHelper('trunc', function(text) {
    if (text.length > 70) {
        text = $.trim(text.substr(0, 70)) + '...';
    }
    return new Handlebars.SafeString(text);
});

// use handlebarsjs for marionette
Marionette.TemplateCache.prototype.compileTemplate = function(rawTemplate) {
    return Handlebars.compile(rawTemplate);
};

function diff2Html(diff) {
    var lines = diff.match(/[^\r\n]+/g);
    var html_lines = [];

    function escapeSpaces (str) {
        return str.replace(/ /g, "&nbsp;");
    }
    _.each(lines, function(line) {
        var newL = escapeSpaces(line);
        var cl = '';
        if (line.indexOf('@@') === 0) {
            cl = 'gc';
        }
        if (line[0] === '-') {
            cl = 'gd';
        }
        if (line[0] === '+') {
            cl = 'gi';
        }
        var l = getTemplate('tpl-diff-line', {
            line: newL,
            cl: cl
        });
        html_lines.push(l);
    });

    var blockHTML = getTemplate('tpl-diff-block', {block: html_lines.join('')});
    return blockHTML;
}

var TEMPLATES = window.TEMPLATES = {};
function getTemplate(templateID, context) {
    var template, $template;
    if (TEMPLATES[templateID] !== undefined) {
        return TEMPLATES[templateID](context);
    } else {
        template = $('#' + templateID);
        if (template.length > 0) {
            $template = Handlebars.compile(template.html());
            TEMPLATES[templateID] = $template; // save compiled template on cache
            return $template(context);
        } else {
            return 'unable to find template "' + templateID + '"';
        }
    }
}
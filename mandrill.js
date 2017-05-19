Mandrill = {

    options: {},
    
    config: function (options) {
        // Taken verbatim from https://mandrillapp.com/api/docs/. We could save a camelCase conversion and camelCase all calls inline below.
        var categories = {
            users: ['info', 'ping', 'ping2', 'senders'],
            messages: ['send', 'send-template', 'search', 'search-time-series', 'info', 'content', 'parse', 'send-raw', 'list-scheduled', 'cancel-scheduled', 'reschedule'],
            tags: ['list', 'delete', 'info', 'time-series', 'all-time-series'],
            rejects: ['add', 'list', 'delete'],
            whitelists: ['add', 'list', 'delete'],
            senders: ['list', 'domains', 'add-domain', 'check-domain', 'verify-domain', 'info', 'time-series'],
            urls: ['list', 'search', 'time-series', 'tracking-domains', 'add-tracking-domain', 'check-tracking-domain'],
            templates: ['add', 'info', 'update', 'publish', 'delete', 'list', 'time-series', 'render'],
            webhooks: ['list', 'add', 'info', 'update', 'delete'],
            subaccounts: ['list', 'add', 'info', 'update', 'delete', 'pause', 'resume'],
            inbound: ['domains', 'add-domain', 'check-domain', 'delete-domain', 'routes', 'add-route', 'update-route', 'delete-route', 'send-raw'],
            exports: ['info', 'list', 'rejects', 'whitelist', 'activity'],
            ips: ['list', 'info', 'provision', 'start-warmup', 'cancel-warmup', 'set-pool', 'delete', 'list-pools', 'pool-info', 'create-pool', 'delete-pool', 'check-custom-dns', 'set-custom-dns'],
            metadata: ['list', 'add', 'update', 'delete']
        };
        var headers = {
            'User-Agent': 'Meteor package wylio:mandrill/1.0.0'
        };

        var instance = this;
        instance.options.username = options["username"];
        instance.options.key = options["key"];
        instance.options.port = options["port"] || "465";
        instance.options.host = "smtp.mandrillapp.com";
        instance.options.baseUrl = options.baseUrl || 'https://mandrillapp.com/api/1.0/';
        // set the environment SMTP server
        process.env.MAIL_URL = "smtp://" + encodeURIComponent(this.options.username) + ":" + this.options.key + "@" + this.options.host + ":" + this.options.port;

        // wrap the full Mandrill API
        Object.keys(categories).forEach(function (category) {
            instance[category] = {};
            categories[category].forEach(function (call) {
                // converting to camelCase is for our convenience; Mandrill takes https://mandrillapp.com/api/1.0/messages.sendTemplate.json as well as https://mandrillapp.com/api/1.0/messages.send-template.json
                var camelCaseName = call.replace(/-(.)/g, function (match, p1) {
                    return p1.toUpperCase()
                });
                instance[category][camelCaseName] = function (options, callback) {
                    var url = instance.options.baseUrl + category + '/' + call + '.json';
                    options = options || {};  // the ping call has no options to send
                    options.key = options.key || instance.options.key;

                    // perform an async call if a callback is provided, or return the result otherwise
                    if (!!callback) {
                        HTTP.post(url, {data: options, headers: headers}, callback);
                    } else {
                        return HTTP.post(url, {data: options, headers: headers});
                    }
                    // ^^ that is all this package really does, but we needed a package, didn't we?
                }
            });
        });
    },
    
    sendTemplate: function (options) {
        console.error('Please see the "Breaking changes" section in the wylio:mandrill README');
        process.exit(1);
    }
};

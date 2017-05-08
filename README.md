# Mandrill for Meteor [![Build Status](https://travis-ci.org/Wylio/meteor-mandrill.svg)](https://travis-ci.org/Wylio/meteor-mandrill/) [![Percentage of issues still open](http://isitmaintained.com/badge/open/Wylio/meteor-mandrill.svg)](http://isitmaintained.com/project/Wylio/meteor-mandrill "Percentage of issues still open") ![GitHub license](https://img.shields.io/:license-mit-blue.svg?style=flat)


Meteor package for sending email (and more) directly via [Mandrill's HTTP POST API](https://mandrillapp.com/api/docs/).

NOTE: Mandrill used to offer free accounts that could send up to 12,000 emails per month, but that is [no longer the case](https://twitter.com/adamegreer/status/622037317616840704) after July 17, 2015. Existing users will maintain the free plan.


## Notes on other packages

This is the original package with a new maintainer, and unlike some (now outdated) forks, it implements the *full* [Mandrill REST API](https://mandrillapp.com/api/docs/).

Other packages use the [`mandrill-api` npm package](https://www.npmjs.com/package/mandrill-api). It's unclear why you'd want the Node package, because [all it does is use the HTTP POST API without much extra processing](https://bitbucket.org/mailchimp/mandrill-api-node/src/).


## Installation

    $ meteor add wylio:mandrill

The package only installs itself on the server, though in theory it could work just as well on the client, thanks to Meteor's isomorphic HTTP package. For security reasons, using it on the client isn't a good idea.


## Usage

```js
// server code
Mandrill.config({
  username: process.env.MANDRILL_API_USER,  // the email address you log into Mandrill with. Only used to set MAIL_URL.
  key: process.env.MANDRILL_API_KEY  // get your Mandrill key from https://mandrillapp.com/settings/index
  port: 587,  // defaults to 465 for SMTP over TLS
  host: 'smtps.mandrillapp.com',  // the SMTP host
  // baseUrl: 'https://mandrillapp.com/api/1.0/'  // update this in case Mandrill changes its API endpoint URL or version
});

// Meteor method code
this.unblock();
try {
  [result = ]Mandrill.<category>.<call>(options, [callback]);
} catch (e) {
  // handle error
}
```

Categories are `messages`, `templates`, [etc.](mandrill.js#L7). Each category has a series of calls, listed at `https://mandrillapp.com/api/docs/<category>.JSON.html`. If you pass a `callback`, an async call will be made, and the callback will be passed `error` and `result` by Meteor's [HTTP.call](http://docs.meteor.com/#/full/http_call). Otherwise, the method returns the raw HTTP POST result from Mandrill and you should use try/catch to handle errors. You'll likely want `result.data`.

The package will also configure the `MAIL_URL` environment variable to point to the Mandrill secure SMTP server (port 465).


## Examples

### Sending template emails

The `messages.sendTemplate` method uses Mandrill's `https://mandrillapp.com/api/1.0/messages/send-template.json` call.

Read more on how to use merge tags in the [Mandrill docs](https://mandrill.zendesk.com/hc/en-us/articles/205582487-How-do-I-use-merge-tags-to-add-dynamic-content-). Find out what else you can send, including how to send [mc:edit](https://mandrill.zendesk.com/hc/en-us/articles/205582497-How-do-I-add-dynamic-content-using-editable-regions-in-my-template-) regions, by reviewing the [Mandrill API documentation](https://mandrillapp.com/api/docs/messages.JSON.html#method=send-template). Mandrill can now use Handlebars instead of the old-style MailChimp `*|MERGEVARS|*`. Read more on [Handlebars in Mandrill](https://mandrill.zendesk.com/hc/en-us/articles/205582537-Using-Handlebars-for-dynamic-content).


```js

Mandrill.messages.sendTemplate({
    key: 'YOUR_MANDRILL_API_KEY', // optional, if you have set it via Mandril.config() already
    template_name: 'YOUR_TEMPLATE_SLUG_NAME',
    template_content: [
      {
          name: 'body',
          content: 'Breaking news! Federal Agents Raid Gun Shop, Find Weapons'
      }
    ],
    message: {
        subject: 'Meteor Newsletter',
        from_email: /* your app's from email ,e.g. Accounts.emailTemplates.from */,
        to: [
            { email: 'email@example.com' }
        ],
        // global merge variable in the *|VARIABLE|* format
        global_merge_vars: [
            {
                name: 'var1',
                content: 'Global Value 1'
            }
        ],
        // per-recipient merge vars
        merge_vars: [
            {
                rcpt: 'email@example.com',
                vars: [
                    {
                        name: 'fname',
                        content: 'John'
                    },
                    {
                        name: 'lname',
                        content: 'Smith'
                    }
                ]
            }
        ]
    }
});
```

### Using Meteor's Accounts.emailTemplates

You can easily customize Meteor's outgoing emails to send Mandrill templates, using [templates.render](https://mandrillapp.com/api/docs/templates.JSON.html#method=render). Simply set `Accounts.emailTemplates.enrollAccount.html` (or `Accounts.emailTemplate.resetPassword.html` or `.verifyEmail.html`) to the result of the `render` call, passing the template name and parameters.

Note that the `templates.render` call, [strangely, doesn't support Handlebars](https://twitter.com/dandv/statuses/622585696574803968). You'll have to use the old-style `*|VARIABLE|*` MailChimp variables, without [Handlebars features like loops or conditionals](https://mandrill.zendesk.com/hc/en-us/articles/205582537-Using-Handlebars-for-dynamic-content).

```js
Accounts.emailTemplates.enrollAccount.html = function (user, url) {
  var referralCode = ... // generate a Random.id()
  var result;
  try {
    result = Mandrill.templates.render({
      template_name: 'the-slug-of-your-template',
      template_content: [
        {
          name: 'referrallink',
          content: 'https://yourdomain.com/?ref=' + referralCode
        },
        {
          name: 'verificationurl',
          content: url
        }
      ],
      merge_vars: [
        {
          name: 'REPLACEME',
          content: 'Global merge var replacement'
        }
      ]
    });
  } catch (error) {
    console.error('Error while rendering Mandrill template', error);
  }
  return result.data.html;
}
```

To automatically generate text from the HTML, in theory you would [set the `X-MC-AutoText` header to `1`](https://mandrill.zendesk.com/hc/en-us/articles/205582117-Using-SMTP-Headers-to-customize-your-messages#automatically-generate-plain-text-from-html-content):


```js
Accounts.emailTemplates.headers = {
  'X-MC-AutoText': true
};
```

In practice this doesn't work, due to a [Meteor issue](https://github.com/meteor/meteor/issues/4768).



## Breaking changes in v1.0

If you're upgrading from v0.x, you need to update the package as follows:

    meteor update wylio:mandrill --allow-incompatible-update

Version 1.0 implements the *complete* Mandrill API, and no longer catches errors to the console, so
that you can take more appropriate action in case an API call fails. Due to this latter change,
backwards compatibility with 0.x was not provided; instead you only need to make one simple change:

> `Meteor.Mandrill.sendTemplate` is now `Mandrill.messages.sendTemplate`.

As you can see, `Meteor.Mandrill` was replaced by the `Mandrill` global. This applies to the
`Mandrill.config()` call as well as to all other calls, e.g. `Mandrill.messages.*`.

The only other breaking change is that `Meteor.Mandrill.send` no longer works. This was simply an
alias for Meteor's `Email.send`, which provided no added value. Just use `Email.send` to send through
the Mandrill SMTP. `Mandrill.messages.send()` will through Mandrill's HTTP POST API.


## Authors

Originally written by [@danieljonce](https://github.com/danieljonce).
Re-written from scratch and maintained by [Dan Dascalescu](https://github.com/dandv).

License: MIT

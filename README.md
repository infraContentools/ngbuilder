# Angular module builder

## TL;DR

A wrapper for common tasks in a frontend project, using Gulp, Browserify and friends.

## Install with npm

```

$ npm install -g ngbuilder

```

## Goals

Write a modular/pluggable component builder to AngularJS, that does the common things of
all projects, through plugins:


## Plugins

### ngbuilder-src

- You write all your `.js` files inside a "/src" folder. Angular annotations 
in the sources are handled with ng-annotate. ES6 syntax is handed to traceur.
The files go through JSHint to check for common mistakes. The sources are concatenated,
and the result is write to `index.js` in the module root. The name "index.js" has a reason:
Browserify can find it with a simple `require('/path/to/module');`

### ngbuilder-sass / ngbuilder-less

- You write your `.scss/.less/.whatever` files in a "scss/less/whatever" folder, then
the plugin outputs a `module.css` file in the module root


### ngbuilder-templateCache

- You write your views (`.html` partials) in a "views" folder and they are 
bundled as JS files, using AngularJS `$templateCache`. The views are saved to
`/src/views.js`

### ...

And so on.


### ngbuilder-browserify

The steps above will generate some files that can be put together to make an app.
For the JS files, browserify can generate a final bundle with all the dependencies.

## Commands

See the usage options right from the command-line. On a terminal, run this:

```
$ ngbuilder
```

## Module structure

Each module should have a structure similar to this:


```

/src			module JS sources (expected: module.js + **/*.js)
/views			HTML partials (mostly directive templates)
/test			Unit tests
/scss			SCSS sources

// soon
/i18n			Translation tables

```

## App structure

Apps follow the same structure of a module. Modules and apps are barely the same
thing. The only difference is that an `app` will import all the module it needs 
and have them declared as module dependencies.

So, if your app called `foo` have `user` and `store` as module dependencies,
your app would be like this:

```javascript

var $module = angular.module('foo', ['user', 'store']);
export $module;

$module.controller('MyCtrl', ...)
// ...

```

Since we have __Browserify__ and __ES6__ support built-in, you would do it this way:

```javascript

import user from 'user';
import store from 'store';

angular.module('foo', [user.name, store.name]);
// ...

```

The reason for this is:

- The ES6 modules syntax will be converted to `require()` syntax to be used by
Browserify. It is also super clean and beautiful :D

- Each module you import will be actually a reference to the Angular's `module`
object (that one returned by `angular.module('modulename')`), which has a `name`
property. So, using this property, you are actually pointing to that module.



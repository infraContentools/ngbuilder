# Angular module builder

## Install with npm

```

$ npm install -g ngbuilder

```

## Goals

Write a modular/pluggable component builder to AngularJS, with the following:

- You write all your `.js` files inside a "/src" folder
- You write your `.scss/.less/.whatever` files in a "scss/less/whatever" folder
- You write your views (`.html` partials) in a "views" folder and they are 
bundled with the sources, using `$templateCache`
- And so on.

The builder then should load a plugin to "compile" each of this folder contents,
to generate a single file for each resource 
(module.js, module.css, module.i18n.json...)

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

// soon
/test			Unit tests
/i18n			Translation tables
/scss			SCSS sources
```

## App structure

Apps follow the same structure of a module. Modules and apps are barely the same
thing. The only difference is that an `app` will import all the module it needs 
and have them declared as module dependencies.

So, if your app called `foo` have `user` and `store` as module dependencies,
your app would be like this:

```javascript

angular.module('foo', ['user', 'store']);
// ...

```

Since we have __Browserify__ and __ES6__ support built-in, so you would do it this way:

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



# Angular module builder

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

## Angular module structure

Each module should have a structure similar to this:


```
/src			module JS sources (expected: module.js + **/*.js)
/test			tests (soon)
/i18n			translation tables (soon)
/scss			SCSS sources (soon)
```

## Output

The builder watches generate a "index.js" file per module

```
/index.css		module CSS file (soon)
/index.js		module main file
```

## App structure

Apps follow the same structure of a module, with a little difference: the app
must import all the modules it will need to run.


## Module vs App

Modules and apps are barely the same thing. The only difference is that an `app`
will import all the module it needs and have them as module dependencies.

So, if your __app__ `foo` have a `user` module and a `login` module as dependencies,
your app would be like this:

```
angular.module('foo', ['user', 'login']);
```



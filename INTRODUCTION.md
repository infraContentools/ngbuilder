# Starting a project (soon)

In a new folder, run this generator:

```
slush ngbuilder

```

# Start coding

## What is a library

Library is any AngularJS module that covers business logic or resources used
by others modules

## What is an app

Each module inside the apps folder is a **standalone** SPA project.

You can have several small top-level modules that use resources both from 3rd party
libs (mostly installed with Bower) and resources in your own library. These are the
visual parts of your stack (the views), plus the controllers that make these
views alive. To interact with the underlying systems (sockets, REST APIs...)
you want to write a module and put it inside the **library** folder, to share your
business logic with the apps you make.

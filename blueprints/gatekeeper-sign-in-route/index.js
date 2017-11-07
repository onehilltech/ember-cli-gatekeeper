const fs          = require ('fs-extra');
const path        = require ('path');
const chalk       = require ('chalk');
const EmberRouterGenerator = require ('ember-router-generator');

module.exports = {
  description: 'Generates a sign-in route, controller, and template, and registers the route with the router.',

  availableOptions: [
    { name: 'path', type: String, default: '' },
    { name: 'skip-router', type: Boolean, default: false },
    { name: 'reset-namespace', type: Boolean }
  ],

  fileMapTokens: function() {
    return {
      __templatepath__: function(options) {
        if (options.pod) {
          return path.join (options.podPath, options.dasherizedModuleName);
        }
        return 'templates';
      },
      __templatename__: function(options) {
        if (options.pod) {
          return 'template';
        }

        console.log (options);

        return options.dasherizedModuleName;
      },
      __root__: function(options) {
        if (options.inRepoAddon) {
          return path.join('lib', options.inRepoAddon, 'addon');
        }

        if (options.inDummy) {
          return path.join('tests','dummy','app');
        }

        if (options.inAddon) {
          return 'addon';
        }

        return 'app';
      }
    };
  },

  shouldEntityTouchRouter: function(name) {
    let isIndex = name === 'index';
    let isBasic = name === 'basic';
    let isApplication = name === 'application';

    return !isBasic && !isIndex && !isApplication;
  },

  shouldTouchRouter: function(name, options) {
    let entityTouchesRouter = this.shouldEntityTouchRouter(name);
    let isDummy = !!options.dummy;
    let isAddon = !!options.project.isEmberCLIAddon();
    let isAddonDummyOrApp = (isDummy === isAddon);

    return (entityTouchesRouter && isAddonDummyOrApp && !options.dryRun && !options.inRepoAddon && !options.skipRouter);
  },

  afterInstall: function(options) {
    updateRouter.call(this, 'add', options);
  },

  afterUninstall: function(options) {
    updateRouter.call(this, 'remove', options);
  }
};

function updateRouter(action, options) {
  let entity = options.entity;
  let actionColorMap = {
    add: 'green',
    remove: 'red'
  };
  let color = actionColorMap[action] || 'gray';

  if (this.shouldTouchRouter(entity.name, options)) {
    writeRoute(action, entity.name, options);

    this.ui.writeLine('updating router');
    this._writeStatusToUI(chalk[color], action + ' route', entity.name);
  }
}

function findRouter(options) {
  let routerPathParts = [options.project.root];

  if (options.dummy && options.project.isEmberCLIAddon()) {
    routerPathParts = routerPathParts.concat(['tests', 'dummy', 'app', 'router.js']);
  } else {
    routerPathParts = routerPathParts.concat(['app', 'router.js']);
  }

  return routerPathParts;
}

function writeRoute(action, name, options) {
  let routerPath = path.join.apply(null, findRouter(options));
  let source = fs.readFileSync(routerPath, 'utf-8');

  let routes = new EmberRouterGenerator(source);
  let newRoutes = routes[action](name, options);

  fs.writeFileSync(routerPath, newRoutes.code());
}

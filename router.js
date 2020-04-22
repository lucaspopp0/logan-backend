const _ = require('lodash');
const controllers = require('./controllers');
const auth = require('./utils/auth');

const ROUTE_MAP = {
    '/auth': {
        'post': {
            requiresAuth: false,
            handler: auth.verifyGoogleToken
        }
    },
    '/users/clean': {
        'post': {
            requiresAuth: true,
            handler: controllers.users.clean
        }
    },
    '/users/me': {
        'get': {
            requiresAuth: true,
            handler: controllers.users.getMe
        }
    },
    '/users': {
        'post': {
            requiresAuth: false,
            handler: controllers.users.create
        }
    },
    '/tasks': {
        'get': {
            requiresAuth: true,
            handler: controllers.tasks.getAll
        },
        'post': {
            requiresAuth: true,
            handler: controllers.tasks.create
        },
        'put': {
            requiresAuth: true,
            handler: controllers.tasks.update
        },
        'delete': {
            requiresAuth: true,
            handler: controllers.tasks.delete
        }
    },
    '/semesters': {
        'get': {
            requiresAuth: true,
            handler: controllers.semesters.getAll
        },
        'post': {
            requiresAuth: true,
            handler: controllers.semesters.create
        },
        'put': {
            requiresAuth: true,
            handler: controllers.semesters.update
        },
        'delete': {
            requiresAuth: true,
            handler: controllers.semesters.delete
        }
    },
    '/courses': {
        'get': {
            requiresAuth: true,
            handler: controllers.courses.getAll
        },
        'post': {
            requiresAuth: true,
            handler: controllers.courses.create
        },
        'put': {
            requiresAuth: true,
            handler: controllers.courses.update
        },
        'delete': {
            requiresAuth: true,
            handler: controllers.courses.delete
        }
    },
    '/sections': {
        'get': {
            requiresAuth: true,
            handler: controllers.sections.getAll
        },
        'post': {
            requiresAuth: true,
            handler: controllers.sections.create
        },
        'put': {
            requiresAuth: true,
            handler: controllers.sections.update
        },
        'delete': {
            requiresAuth: true,
            handler: controllers.sections.delete
        }
    },
    '/assignments': {
        'get': {
            requiresAuth: true,
            handler: controllers.assignments.getAll
        },
        'post': {
            requiresAuth: true,
            handler: controllers.assignments.create
        },
        'put': {
            requiresAuth: true,
            handler: controllers.assignments.update
        },
        'delete': {
            requiresAuth: true,
            handler: controllers.assignments.delete
        }
    }
}

function tagAuthedRoutes(app) {
    for (const route in ROUTE_MAP) {
        app.use(route, (req, res, next) => {
            if (req.requiresAuth == undefined && !!_.get(ROUTE_MAP, [route, req.method.toLowerCase()])) {
                req.requiresAuth = ROUTE_MAP[route][req.method.toLowerCase()].requiresAuth;
            }

            next();
        })
    }
}

function setRoutes(app) {
    for (const route in ROUTE_MAP) {
        for (const method in ROUTE_MAP[route]) {
            app[method](route, async (req, res) => {
                try {
                    await ROUTE_MAP[route][method].handler(req, res);
                } catch (err) {
                    console.error(err.stack);
                    res.status(500).end(err.message);
                }
            });
        }
    }
}

module.exports = {
    ROUTE_MAP,
    tagAuthedRoutes,
    setRoutes
}
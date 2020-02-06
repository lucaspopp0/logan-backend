const _ = require('lodash');
const controllers = require('./controllers');

const ROUTE_MAP = {
    '/users': {
        'post': {
            requiresAuth: false,
            handler: controllers.users.createUser
        }
    },
    '/tasks': {
        'get': {
            requiresAuth: true,
            handler: controllers.tasks.getTasks
        },
        'post': {
            requiresAuth: true,
            handler: controllers.tasks.createTask
        },
        'put': {
            requiresAuth: true,
            handler: controllers.tasks.updateTask
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
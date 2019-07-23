import page from 'page';

class index {

    constructor({ routes = [], hooks = [], ...options }) {

        this._routes = routes;
        this._hooks = hooks;
        this._options = options;

        this._before = null;
        this._enter = null;
        this._after = null;
        this._exit = null;

        page('*', (ctx, next) => {
            const qs = ctx.querystring ? ctx.querystring.replace('?', '').split('&') : [];
            ctx.query = qs.reduce((query, param) => {
                let [key, val] = param.split('=');
                query[key] = decodeURIComponent(val);
                return query;
            }, {});
            
            Promise.all(this._hooks.map(p => p(ctx))).then(next);
        });
    }

    base(path) {
        page.base(path);
    }

    strict(enable) {
        page.strict(enable);
    }

    before(callback) {
        typeof callback === 'function' && (this._before = callback);
    }

    enter(callback) {
        typeof callback === 'function' && (this._enter = callback);
    }

    after(callback) {
        typeof callback === 'function' && (this._after = callback);
    }

    exit(callback) {
        typeof callback === 'function' && (this._exit = callback);
    }

    start() {

        typeof this._before === 'function' && page('*', this._before);

        this._routes.forEach(({ path, before, after, exit, component }) => {

            let callbacks = [];

            typeof before === 'function' && callbacks.push(before);

            callbacks.push((ctx, next) => {
                ctx.handled = true; // it's important for redirects
                Promise.resolve(component).then(component => {
                    (component.preload ? 
                        component.preload(ctx) : 
                        Promise.resolve()
                    ).then((state = {}) => {
                        Object.assign(ctx.state, state);
                        ctx.save();
                        ctx.component = component.default || component;
                        return next();
                    });
                });
            });

            typeof this._enter === 'function' && callbacks.push(this._enter);
            typeof after === 'function' && callbacks.push(after);

            page(path, ...callbacks);

            typeof exit === 'function' && page.exit(path, exit);
        });

        typeof this._after === 'function' && page('*', this._after);
        typeof this._exit === 'function' && page.exit('*', this._exit);
       
        page.start(this._options);
    }
    
    stop() {
        page.stop();
    }

    show(...args) {
        page.show(...args);
    }

    redirect(...args) {
        page.redirect(...args);
    }

    back(...args) {
        page.back(...args);
    }
}

export default index;

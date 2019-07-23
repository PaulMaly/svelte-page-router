# svelte-page-router

Simple wrapper based on pagejs to make DX similar to config-based router. Play well with [Svelte 3](https://v3.svelte.technology).

## Usage

Install with npm or yarn:

```bash
npm install --save svelte-page-router
```

Then import router to your `main.js` file:

```javascript
import Router from 'svelte-page-router';

import App from './App.svelte';

const options = {
	click: true,
	popstate: true,
	dispatch: true,
	hashbang: false,
};

const router = new Router({
	routes: [{
		path: '/static',
		component: import('./pages/Static')
	},{
		path: '/dynamic/:id/:type?',
		component: import('~/pages/Dynamic')
	},{
		path: '/secure',
		component: import('~/pages/Secure'),
		before(ctx, next) {
			(/* check authorization */) ? 
				next() : 
				router.redirect('/static');
		}				
	}, {
		path: '*',
		component: import('~/pages/NotFound'),
	}],
	hooks: [
		(ctx, next) => {
			/* simple hooks to modify context for any route */
			next();
		}
	],
	...options
});

// simple integrate with Svelte

const app = new App({
	target: document.body,
	props: { component: null }
});

router.enter((ctx, next) => {
	app.$set({ ...ctx });
	tick().then(next);
});

router.exit((ctx, next) => {
	app.$set({ component: null });
	tick().then(next);
});

router.start();
```

Switch pages in `App.svelte`:

```html
<svelte:component 
	this={component} 
	{...state} 
	{pathname} 
	{path} 
	{hash} 
	{params} 
	{query}
/>

<script>
	export let component = null,
		pathname = '',
		path = '',
		hash = '',
		params = {},
		query = {},
		state = {};
</script>
```

Use `preload` function to preload some data before page component will be rendered:

```html
<ul>
{#each items as item}
	<li>{item.title}</li>
{/each}
</ul>

<script context="module">
	export async function preload(ctx) {
		const res = fetch(`/items/${ctx.params.id}?type=${ctx.params.type}&page=${ctx.query.page}`);
		const items = res.json();
		return { items };
	}
</script>

<script>
	export let items = [];
</script>
```

## Context

Is a context object from [pagejs](http://visionmedia.github.io/page.js/#context) with additional property `component` which is a Svelte component associated with the current route.

## Methods

```javascript
router.base(); // base path
router.strict(true); // strict matching

router.before((ctx, next) => { /* ... */ }); // guard before any route
router.after((ctx, next) => { /* ... */ }); // guard after any route

router.enter((ctx, next) => { /* ... */ }); // guard entring any route
router.exit((ctx, next) => { /* ... */ }); // guard exiting any route

router.start(); // start listening
router.stop(); // stop listening

router.redirect('/some'); // redirects
router.back(); // history back
```

## License

MIT
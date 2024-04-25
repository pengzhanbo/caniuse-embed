# CanIUse Embed

Embed up-to-date data from [caniuse.com](https://caniuse.com/) and
[mozilla's browser compat data](https://github.com/mdn/browser-compat-data).
Displays feature support data for multiple versions of the 10 major browsers.
Configurable, reliable, and fully responsive.

## Document

- See [Documention](https://caniuse-embed.vercel.app/) for more details.

## Usage

Include the following javascript file in your document.

```html
<script type="module" src="https://caniuse-embed.vercel.app/embed.js"></script>
```

Paste this snippet where you want the embed to be displayed:

```html
<p class="ciu-embed" data-feature="{feature}" data-past="2" data-future="3" data-meta="be6d"></p>
```

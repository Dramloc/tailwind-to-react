# Tailwind to React

Tailwind + Alpine 🔀 React: turn your [tailwind](https://tailwindcss.com/) and [alpine](https://github.com/alpinejs/alpine) markup into React components!

Use the Input panel to develop your component and retrieve the generated React code in the Output panel.

All the examples are inspired by the preview components of Tailwind UI: https://tailwindui.com/preview. You should be able to use this tool to convert _most_ of Tailwind UI components.

For now, the tailwind config can not be customized (but might be in the future!). If you want more control over it, you can use https://play.tailwindcss.com/ (a big inspiration for this tool).

## Supported features

You can use the following Alpine JS directives to create dynamic state:

- x-data: https://github.com/alpinejs/alpine#x-data

  Example:

  ```html
  <div x-data="{ open: true, toggle() { this.open = !this.open } }">...</div>
  ```

- x-bind: https://github.com/alpinejs/alpine#x-bind

  Example:

  ```html
  <div :aria-expanded="open">...</div>
  <button x-bind:class="{ 'ring-2 ring-offset-2 ring-offset-gray-100 ring-indigo-500': open }">
    ...
  </button>
  ```

- x-on: https://github.com/alpinejs/alpine#x-on

  Example:

  ```html
  <button x-on:click.away="open = false">...</button>
  <div @keydown.window.escape="open = false">...</div>
  ```

- x-show: https://github.com/alpinejs/alpine#x-show

  Example:

  ```html
  <div x-show="open">...</div>
  ```

- x-transition: https://github.com/alpinejs/alpine#x-show

  Example:

  ```html
  <div
    x-show="open"
    x-transition:enter="duration-150 ease-out"
    x-transition:enter-start="opacity-0 scale-95"
    x-transition:enter-end="opacity-100 scale-100"
    x-transition:leave="duration-100 ease-in"
    x-transition:leave-start="opacity-100 scale-100"
    x-transition:leave-end="opacity-0 scale-95"
  >
    ...
  </div>
  ```

- x-text: https://github.com/alpinejs/alpine#x-text

  Example:

  ```html
  <span x-data="{ index: 0 }" x-text="['Foo', 'Bar', 'Baz'][index]">...</span>
  ```

- x-init: https://github.com/alpinejs/alpine#x-init ⚠ Only supports `$el.focus()`

  Example:

  ```html
  <input x-init="$el.focus()" />
  ```

## Upcoming features

- [] Support for custom tailwind config
- [] [twin.macro](https://github.com/ben-rogerson/twin.macro) support

Have fun!

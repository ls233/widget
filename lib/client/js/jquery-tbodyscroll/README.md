tbodyScroll jQuery plugin
=========================

Add vertical scrollbar to `<tbody>` element and keep `<thead>` and
`<tfoot>` contents above/below table while scrolling body.

[Demo and examples](http://powerman.name/example/tbodyScroll/).

Tested on:
* jQuery 1.4.3
* Opera 10.63/Linux
* Opera 10.63/Windows
* Firefox 3.6.12/Linux
* Firefox 3.6.12/Windows
* Safari 5.0.2/Mac
* Chromium 7.0.517.41/Linux
* IE 8/Windows

## Usage

```javascript
$('table').tbodyScroll({
     thead_height:   '30px',
     tbody_height:   '80px',
     tfoot_height:   '20px',
     head_bgcolor:   'transparent',
     foot_bgcolor:   'transparent'
});
```

Required user CSS:

- User must define *same* width for `<th>` and `<td>` in each column,
  because `<thead>` and `<tfoot>` will be "disconnected" from `<tbody>`
  and won't keep same width automatically anymore.
- Some changes in user CSS may be needed because `<table>` will be wrapped
  by `<div style="float:left">`.

Required user markup (either `<thead>` or `<tfoot>` is optional):

```html
<style>
    th.some,  td.some  { width: ...; }
    th.other, td.other { width: ...; }
    ...
</style>
<table>
<thead>
    <tr><th class="some">...</th>
        <th class="other">...</th>
        ...
    </tr>
</thead>
<tbody>
    <tr><td class="some">...</td>
        <td class="other">...</td>
        ...
    </tr>
    ...
</tbody>
<tfoot>
    <tr><th class="some">...</th>
        <th class="other">...</th>
        ...
    </tr>
</tfoot>
</table>
```

Generated markup:

```html
<div class="tbodyScroll-outer">
    <div class="tbodyScroll-head-bg"></div>
    <div class="tbodyScroll-foot-bg"></div>
    <div class="tbodyScroll-inner">
        {table}
    </div>
</div>
```

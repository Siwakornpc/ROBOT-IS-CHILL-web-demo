Every details explained in **Ca**, it is possible to filter them by other details:

We use [`ric-api.sno.mba`](https://ric-api.sno.mba) to get the details that are easy to get. And for the hard part, it requires reading files and or directory straight from GitHub.

# `/tiles.json`
```json
NAME: {
	"active_color": [ACTIVE_COLOR_X <int>, ACTIVE_COLOR_Y <int>],
    "inactive_color": [INACTIVE_COLOR_X <int>, INACTIVE_COLOR_Y <int>],
    "sprite": [SOURCE <string>, SPRITE <string>],
    "tiling": TILING_MODE <string>,
    "tags": TAGS <list[string]>
}
```
Searches by sprite name, or from original file name.
`active_color`: Uses a palette panel, then check on any color in the palette to filter for that color.
`inactive_color`: Uses a palette panel, then check on any color in the palette to filter for that color.
`sprite [SOURCE]`: Filter for those sprites from a source.
`tiling`: Filter tilings from a dropdown-text input, containing all tilings
`tags`: Filter tags using a text type input.

# `/macros.json`
```json
NAME: {
    "creator": AUTHOR_ID <int>,
    "value": VALUE <string>,
    "description" DESCRIPTION <string>
}
```
`creator`: Search any macros that is created by user by filtering it by User ID, or User's name.
`value`: Filter for any macros that has that string in the value.
`description`: Filter for any macros that has that string in the description.
It is also filterable to check if a macro is builtin:
`is_builtin`: Filter the show built-in macros from a checkbox.

# `/filters.json`
```json
NAME: {
    "author": AUTHOR_ID <int>,
    "absolute": IS_ABSOLUTE <bool>,
    "upload_time" UPLOAD_TIME <int>
}
```
`author`: Search any filters that is created by user by filtering it by User ID, or User's name.
`absolute`: Filter from a tab which will filter for any filters that has relative mode or absolute mode.
`upload_time`: Filter the filters that are being created in Date time local, and relatively before, on or after the time.

# `variants` & `flags`
```json
MAIN_VARIANT_NAME: {
    "description": <string>,
    "syntax": <string>,
    "applied": <string>
}
```
Searches by display name, or from native variant name.
`description`: Filter for any variants that has that string in the description.
`syntax`: Filter for any variants that has that string in the syntax.
`applied`: Filter for any variants that has that string in when applied.

```json
MAIN_FLAG_NAME: {
    "syntax": <string>,
    "description": <string>
}
```
Searches by display name, or from native flag name.
`syntax`: Filter for any flags that has that string in the syntax.
`description`: Filter for any flags that has that string in the description.

Both of them can be searched using native variant syntax in the search.

# `levels`
This section is yet not implemented.

# `palettes`
```json
NAME: {
    "source": SOURCE <string>,
    "colors": COLORS <list[[string || null]]>
}
```
`source`: Filter sources from a dropdown-text input, containing all sources.
`colors`: Uses a color picker system to search for a specific color by looking up on `HEX`, `R|G|B` or `None`
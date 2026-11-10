Every details explained in **Ca**, it is possible to filter them by other details:

We used [`ric-api.sno.mba`](https://ric-api.sno.mba) to find details that are easy to retrieve. And harder parts require reading files and/or directories straight from GitHub.

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
`active_color`: Uses a palette panel, then check each tile if its color is selected in the filter.
`inactive_color`: Same as active_color but for inactive colors.
`sprite [SOURCE]`: Filter sprites from a source.
`tiling`: Filter tilings from a dropdown-text input, containing all tilings
`tags`: Filter for a list of tags using a text type input.

# `/macros.json`
```json
NAME: {
    "creator": AUTHOR_ID <int>,
    "value": VALUE <string>,
    "description" DESCRIPTION <string>
}
```
`creator`: Search for macros created by the user by filtering it by user ID, or username.
`value`: Filter for any macros that contain the string in its value.
`description`: Filter for any macros that contain the string in its description.
`is_builtin`: Filter to show either built-in macros or user created macros with a checkbox.

# `/filters.json`
```json
NAME: {
    "author": AUTHOR_ID <int>,
    "absolute": IS_ABSOLUTE <bool>,
    "upload_time" UPLOAD_TIME <int>
}
```
`author`: Search for filterimages created by the user by filtering it by user ID, or username.
`absolute`: Filter from 2 options for filterimages that have absolute or relative mode.
`upload_time`: Filter for filterimages that are created before, on or after the Date time local.

# `variants` & `flags`
```json
MAIN_VARIANT_NAME: {
    "description": <string>,
    "syntax": <string>,
    "applied": <string>
}
```
Searches by display name, or from native variant name.
`description`: Filter for any variants that contain the string in its description.
`syntax`: Filter for any variants that contain the string in its syntax.
`applied`: Filter for any variants that match when its applied and the filter.

```json
MAIN_FLAG_NAME: {
    "syntax": <string>,
    "description": <string>
}
```
Searches by display name, or from native flag name.
`syntax`: Filter for any flags that contains the string in its syntax.
`description`: Filter for any flags that contains the string in its description.

Both can be searched using native variant syntax in the search.

# `levels`
This section is yet not implemented.

# `palettes`
```json
NAME: {
    "source": SOURCE <string>,
    "colors": COLORS <list[[string || null]]>
}
```
`source`: Filter palettes from a source using a dropdown-text input, containing all sources.
`colors`: Uses a color picker system to search for a specific color by looking up on `HEX`, `R|G|B` or `None`
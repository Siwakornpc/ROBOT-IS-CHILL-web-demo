We used [`ric-api.sno.mba`](https://ric-api.sno.mba) to find details that are easy to retrieve. And harder parts require reading files and/or directories straight from GitHub.

The search allows you to search normally, or using RegExp to let you search for a more flexible range.

# `/tiles.json`
Gets the details from JSON map of all tiles in the bot's database, in the following schema:
```json
NAME: {
	"active_color": [ACTIVE_COLOR_X <int>, ACTIVE_COLOR_Y <int>],
    "inactive_color": [INACTIVE_COLOR_X <int>, INACTIVE_COLOR_Y <int>],
    "sprite": [SOURCE <string>, SPRITE <string>],
    "tiling": TILING_MODE <string>,
    "tags": TAGS <list[string]>
}
```
Since we can't get details on what frames the tiling uses, the frame numbers are declared inside `image_tiling.ts` which includes all tiling sets.

Custom tilings are taken from the sprite's `.toml` files, which are stored inside `.../custom/SOURCE.toml` which has
```toml
extra_frames: FRAMES <list[int]>
```

It is then displayed in the items using the endpoint `/tiles/NAME.gif`. [[+]](https://github.com/ROBOT-IS-CHILL/robot-is-chill-browser-compatible/blob/main/docs/I%20-%20Rest%20API.md)

# `/macros.json`
Gets the details from JSON map of all macros in the bot's database, in the following schema:
```json
NAME: {
    "creator": AUTHOR_ID <int>,
    "value": VALUE <string>,
    "description" DESCRIPTION <string>
}
```
Since the creator doesn't know the cap of the largest integer is 2147483647, but ID are constants, not mutable. It uses a library called `json-bigint` to make sure no precision is lost from getting it, then it is immediately turned into a string after.

The ID is then used in a discord client, which only needs the bot to exist to return metadata to display profile picture, display name and username.

# `/filters.json`
Gets the details from JSON map of all filters in the bot's database, in the following schema:
```json
NAME: {
    "author": AUTHOR_ID <int>,
    "absolute": IS_ABSOLUTE <bool>,
    "upload_time" UPLOAD_TIME <int>
}
```
For the same reason, ID has to be saved as string.
The image loading is incredibly slow, since every image is a PNG, it is heavier than GIF

# `variants` & `flags`
It is taken from looking up skeletons of the defined variants in the GitHub, then it is compiled into
```json
MAIN_VARIANT_NAME: {
    "description": <string>,
    "syntax": <string>,
    "applied": <string>
}
```
and
```json
MAIN_FLAG_NAME: {
    "syntax": <string>,
    "description": <string>
}
```
And the syntax is displayed in a custom "TypeScript"-like highlight.

# `levels`
This section is yet not implemented.

# `palettes`
Gets the palettes from the GitHub Source, mapped into JSON/JavaScript Object, and returns it in the following schema:
```json
NAME: {
    "source": SOURCE <string>,
    "colors": COLORS <list[[string || null]]>
}
```
Due to palettes that share the same name in different sources:
`NAME` has a key of: `SOURCE:NAME` to make each palettes distinguishable and searchable.
`colors` are stored in a 2D array by using the library pngjs reading in chunk length, then pick each color and return as hexidecimal values.

It is also displayed as `NAME (SOURCE)` in both items and details panel.

# `overlays`
It is a permanent data in the GitHub, and contains no JSON mapping.
```json
NAME: {
    "url": <string>
}
```
We use [`ric-api.sno.mba`](https://ric-api.sno.mba) to get the details that are easy to get. And for the hard part, it requires reading files and or directory straight from GitHub.

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
Since we don't get enough details on whether which frames the tiling is, the frames are declared inside `image_tiling.ts` which includes all tiling sets.

Custom tiling are taken from the sprite's `.toml` files, which is stored inside `.../custom/SOURCE.toml` which has
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
Since the creator doesn't know the cap of the largest integer is 2147483647, but ID are constants, not mutable. It is using a library called `json-bigint` to make sure we don't lose any numbers from capping it, then it is immediately turned into a string after.

The ID is then used into a discord client, which only needs the bot to exist, then return as a metadata to display profile picture, display name and username.

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
The image loading is incredibly slow, since every image is a PNG, it is heavy than GIF

# `variants` & `flags`
It is taken from looking up skeletons on each defined variants in the GitHub, then it is compiled into
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
Gets the palettes from the GitHub Source, mapped into JSON/JavaScript Object, and used it in the following schema:
```json
NAME: {
    "source": SOURCE <string>,
    "colors": COLORS <list[[string || null]]>
}
```
While there are names that has the same name, even in different sources:
`NAME` has a key of: `SOURCE:NAME` to make each palettes distinguishable and searchable.
`colors` are stored in a 2D array by using the library pngjs reading in chunk length, and colorpick each colors then return as hexidecimal values.

It is also displayed as `NAME (SOURCE)` in both items and details panel.

# `overlays`
It is a permanent data in the GitHub, and contains no JSON mapping.
```json
NAME: {
    "url": <string>
}
```
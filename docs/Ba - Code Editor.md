The code editor is recreated without a preset library, it is crafted from a test web page, and turned into a component that works as well as it could.

In the editor, it includes custom syntax highlighting, which makes the code easier to read, as each brackets are highlighted with different colors. This applies to Macrosia for Code, for Static and Renders (Combined).

The editor also has a status bar which displays the execution time, which tracks how long it took to render it.
- In Macrosia, it tracks Steps and Execution Time.
- In Render, it tracks Startup Time and Render Time.
The status bar is reactive, so it will collapse to fit the space better, and if there is not enough space, it becomes a 3-dot button.

When typing the name of a macro, flag or variant, it will show an autocomplete popup which will list every keyword that exists either in the API, as a builtin or custom macro and display it in a list with a maximum of 12 items. If the keyword is a macro, it will display on the right if it's made by a user or it is a built-in.

When you `Ctrl` + `Click` on a macro name, it will redirect to the search result of that macro.

Doing the same on a variable redirects to where it's first stored.

The editor has a "Split Screen" button on the top right of the screen, it is dependent on the device, because some do not need a split screen.
The code editor is recreated without a preset library, it is crafted from a test web page, and turn it into a real component that works as good as it could.

In the editor, it includes a custom syntax highlighting, which makes the macro reads more easier, for each brackets are colored as different colors. This includes; Macrosia for Code, for Static and Renders (Combined).

The editor also has a status bar which has the execution time, it tracks how long it took to render it.
- In Macrosia, it tracks Steps and Execution Time.
- In Render, it tracks Startup Time and Render Time.
The status bar is reactive, so it will collapse down to fit the bar more better, and if not enought space, it is a 3-dot button.

When typing a name of a macro, a flag or a variant, it will show an autocomplete popup which will list from every keyword existed inside the files, builtin or custom and display it in a maximum of 12 lists. If the keyword is a macro, it will display on the right if it's made by a user or it is a built-in.

When you press `Ctrl` + `Click` on any macro, it will redirect to the search definition of that macro.

When you press `Ctrl` + `Click` on a variable, it will redirect to the first defined value.

In the editor, it has a "Split Screen" button on the top right of the screen, it is dependent on the device, because some do not need a split screen.
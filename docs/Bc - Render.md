```
Note: The Render API from the code is actually vibe-coded, which needs attention and needs to be replaced sooner or later.
```

The fork is used during production, which will then be turned into an API. It is tested in the web using Quart, and then put inside Render (website), which it's my first time doing it.

Render is actually the slowest choice for rendering, it took 16 or half a minute to startup and about 6 seconds mininum to render one image, and will pause when it is not active for 15 minutes.

In Render, flags and variants will show in autocomplete, but Macrosia doesn't.
# ROBOT IS CHILL web demo

This repository is a port of [ROBOT IS CHILL](https://github.com/ROBOT-IS-CHILL/robot-is-chill) which will include an image rendering, variant mutations and flags, along with Macroscript. Which, will be put inside as a web demo with a VSCode and regex101-like UI/UX, style and themes.

This also includes:
- Babalang Interpretation
- Tiles, Variants, Filters and Macro Searching
- Filters and Macro Info lookup
- Better Debugging mode
- Palette Lookup/Search
- Mobile Levels lookup
- File importing

## What's next

An additional features to Plugins, and with a pre-installed built-in plugins where:
- Users can edit renders inside the render without having to look inside code.
- Be able to add variants on the tile inside renders, and a dynamic editing on each variants.
- A side bar for layers, object palette and others.
- Users can play/pause/stop the render if it includes animation frames (baba>keke) with a playback feature.

And most of all:
- Lets users adds their own plugins, and will be untracked by .gitignore to prevent someone from editing someone else's plugin(s).
- Lets owner delete and edit their own plugins.
With a docs on how to create your own plugin.

## Contributing

You should know that this repository is made for a purpose to contain the power of ROBOT IS CHILL discord bot inside a web demo while it is still simple to use inside the web demo.

### Edit the repo
1. [Download GitHub for Windows](https://gitforwindows.org)
2. Identify yourself
```bash
git config --global user.email "your.email@example.com"
git config --global user.name "Your Name"
```
3. Clone the repository
```bash
git clone https://github.com/Siwakornpc/ROBOT-IS-CHILL-web-demo
```
4. Install packages from packages.json
```bash
npm install
```
After that, you will have a folder that has everything you need to start contributing.
Then do
```bash
npm run dev
```
and open **localhost:3000**

### Committing the changes to repo
1. Add files
```
git add .
```
2. Set committing message
```
git commit -m "Example"
```
3. Push the changes to repo
If you're not too late:
```
git push
```

### Get latest version of the repo
Just do:
```
git pull
```
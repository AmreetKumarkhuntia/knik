# Knik Assets

This directory contains assets for building the Electron desktop application.

## Required Files

### Icons
- **icon.icns** - macOS app icon (512x512px recommended)
- **icon.ico** - Windows app icon (256x256px recommended)  
- **icon.png** - Linux app icon (512x512px recommended)

### macOS Specific
- **entitlements.mac.plist** - macOS entitlements for code signing
- **dmg-background.png** - Background image for DMG installer (540x380px)

## Creating Icons

You can use online tools or command-line utilities to convert PNG to platform-specific formats:

### macOS (.icns)
```bash
# Using iconutil (macOS)
mkdir icon.iconset
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
iconutil -c icns icon.iconset
```

### Windows (.ico)
```bash
# Using ImageMagick
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Linux (.png)
Just use a 512x512 PNG file.

## TODO
- [ ] Create app icon (Knik logo)
- [ ] Generate platform-specific icon formats
- [ ] Create DMG background image
- [ ] Add macOS entitlements file

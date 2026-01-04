# Icons Directory

This directory should contain PWA icons in the following sizes:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
- badge-72x72.png (for notification badge)

## How to Generate Icons

1. Start with a high-resolution logo (at least 512x512 pixels)
2. Use a tool like https://realfavicongenerator.net/ or https://maskable.app/
3. Download the generated icons and place them in this folder

## Icon Requirements

- **PNG format** recommended
- **Square aspect ratio** (1:1)
- **Transparent background** for maskable icons
- For maskable icons, keep important content within the "safe zone" (inner 80%)

## Quick Generation Script

If you have ImageMagick installed:

```bash
# Generate all sizes from a source image
convert logo.png -resize 72x72 icon-72x72.png
convert logo.png -resize 96x96 icon-96x96.png
convert logo.png -resize 128x128 icon-128x128.png
convert logo.png -resize 144x144 icon-144x144.png
convert logo.png -resize 152x152 icon-152x152.png
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 384x384 icon-384x384.png
convert logo.png -resize 512x512 icon-512x512.png
```

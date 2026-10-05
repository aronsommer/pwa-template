#!/bin/sh
# Generates the icons in img/ from the design, a transparent 1024px image.
# Needs ImageMagick. Run it after changing the design or a value below.
set -e
cd "$(dirname "$0")/img"

DESIGN=icon-1024x1024.png
BACKGROUND=blue
OUTSIDE=yellow # Maskable icon only: outside the safe area; in a real app, the same as BACKGROUND
RADIUS=200 # Favicon only: corner radius in px, of 1024

# Square and edge to edge.
magick -size 1024x1024 "xc:$BACKGROUND" "$DESIGN" -composite \
  -strip -alpha off -depth 8 \
  \( +clone -resize 512x512 -write pwa-icon-512x512.png +delete \) \
  -resize 180x180 apple-touch-icon.png

# Rounded corners.
magick -size 1024x1024 xc:none -fill "$BACKGROUND" \
  -draw "roundrectangle 0,0 1023,1023 $RADIUS,$RADIUS" "$DESIGN" -composite \
  -strip -define icon:auto-resize=48,32,16 favicon.ico

# The design at 80%, inside the safe area: a circle 80% as wide as the icon.
magick -size 1024x1024 "xc:$OUTSIDE" -fill "$BACKGROUND" \
  -draw "circle 512,512 512,102" \( "$DESIGN" -resize 80% \) -gravity center -composite \
  -strip -alpha off -depth 8 -resize 512x512 pwa-icon-512x512-maskable.png

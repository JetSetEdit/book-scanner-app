#!/bin/bash

# Script to convert Australian Classification Board symbols to various formats
# Requires ImageMagick and Ghostscript

CLASSIFICATION_DIR="public/classification-symbols"
OUTPUT_DIR="$CLASSIFICATION_DIR/converted"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Converting Australian Classification Board symbols..."

# Convert EPS to PNG (different sizes)
for file in "$CLASSIFICATION_DIR"/*.eps; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .eps)
        echo "Converting $filename..."
        
        # Small size (64x64)
        magick -density 300 "$file" -resize 64x64 "$OUTPUT_DIR/${filename}_64.png"
        
        # Medium size (128x128) 
        magick -density 300 "$file" -resize 128x128 "$OUTPUT_DIR/${filename}_128.png"
        
        # Large size (256x256)
        magick -density 300 "$file" -resize 256x256 "$OUTPUT_DIR/${filename}_256.png"
        
        # High resolution (512x512)
        magick -density 300 "$file" -resize 512x512 "$OUTPUT_DIR/${filename}_512.png"
        
        # Convert to SVG (if possible)
        # Note: This might not work perfectly with all EPS files
        # magick -density 300 "$file" "$OUTPUT_DIR/${filename}.svg"
    fi
done

echo "Conversion complete! Check the $OUTPUT_DIR directory for converted files."

# List the converted files
echo "Converted files:"
ls -la "$OUTPUT_DIR"

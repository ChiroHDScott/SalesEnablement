#!/bin/bash
mkdir -p assets
# Download ChiroHD
curl -L -o assets/chirohd.svg "https://cdn.prod.website-files.com/640bef7e714c5a171f61c3b9/64d10d38c683344bf0e896d8_logo-for-light-backgrounds.svg"

# Create SKED SVG
cat > assets/sked.svg <<EOF
<svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="28" fill="#38bdf8">SKED</text>
</svg>
EOF

# Create Spark SVG
cat > assets/spark.svg <<EOF
<svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<text x="40" y="30" font-family="Arial, sans-serif" font-weight="bold" font-size="28" fill="#f97316">Spark</text>
<path d="M90 5 L85 20 L95 20 L80 35" stroke="#f97316" stroke-width="3" fill="none"/>
</svg>
EOF

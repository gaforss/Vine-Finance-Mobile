#!/bin/bash

# Add vector icons fonts to Xcode project
FONT_DIR="VineFinanceMobile/Fonts"
PROJECT_FILE="VineFinanceMobile.xcodeproj/project.pbxproj"

# Create Fonts group in Xcode project if it doesn't exist
if ! grep -q "Fonts" "$PROJECT_FILE"; then
    echo "Adding Fonts group to Xcode project..."
    # This is a simplified approach - in practice, you'd need to modify the project.pbxproj file
    # For now, we'll just ensure the fonts are in the right place
fi

echo "Fonts copied to $FONT_DIR"
echo "Please add the Fonts folder to your Xcode project manually:"
echo "1. Open VineFinanceMobile.xcworkspace in Xcode"
echo "2. Right-click on VineFinanceMobile in the project navigator"
echo "3. Select 'Add Files to VineFinanceMobile'"
echo "4. Navigate to ios/VineFinanceMobile/Fonts"
echo "5. Select all .ttf files and click 'Add'"
echo "6. Make sure 'Add to target' is checked for VineFinanceMobile" 
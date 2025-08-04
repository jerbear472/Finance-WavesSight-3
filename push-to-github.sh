#!/bin/bash

# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
GITHUB_USERNAME="YOUR_GITHUB_USERNAME"

echo "Setting up GitHub remote..."
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/${GITHUB_USERNAME}/Finance-WaveSight-3.git"

echo "Pushing to GitHub..."
git push -u origin main

echo "Push complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://vercel.com/new"
echo "2. Import your GitHub repository"
echo "3. Select 'Finance-WaveSight-3'"
echo "4. Set the root directory to 'web'"
echo "5. Add environment variables (see below)"
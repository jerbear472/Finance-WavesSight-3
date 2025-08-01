#!/bin/bash

# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
GITHUB_USERNAME="YOUR_GITHUB_USERNAME"
REPO_NAME="Next-WaveSight-3.0"

echo "Setting up new repository: $REPO_NAME"

# Add the new remote
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Create and checkout main branch
git branch -M main

# Push to the new repository
git push -u origin main

echo "Successfully pushed to $REPO_NAME!"
echo "Repository URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
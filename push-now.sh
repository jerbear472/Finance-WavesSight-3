#!/bin/bash

echo "Pushing to GitHub..."
cd "/Users/JeremyUys_1/Desktop/Finance WaveSight 3"

# Set the correct remote
git remote set-url origin https://github.com/jerbear472/Finance-WaveSight-3.git

# Push all branches and tags
git push -u origin main

echo "✅ Push complete!"
echo ""
echo "Since your GitHub is linked to Vercel, the deployment should start automatically."
echo "Check your Vercel dashboard at https://vercel.com/dashboard"
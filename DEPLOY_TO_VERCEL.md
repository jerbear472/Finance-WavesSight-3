# Vercel Deployment Guide for Finance WaveSight 3

## Prerequisites
1. GitHub account with the repository pushed
2. Vercel account (free tier works)
3. Supabase project with database set up

## Step 1: Push to GitHub

1. Edit `push-to-github.sh` and replace `YOUR_GITHUB_USERNAME` with your GitHub username
2. Run:
   ```bash
   ./push-to-github.sh
   ```

## Step 2: Deploy to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `Finance-WaveSight-3` repository
4. Configure the project:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `web` (IMPORTANT!)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

## Step 3: Environment Variables

Add these environment variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Getting Supabase Keys:
1. Go to your Supabase project
2. Settings → API
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete (3-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Step 5: Set up Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Post-Deployment Checklist

- [ ] Test authentication (login/signup)
- [ ] Test trend submission
- [ ] Check if images upload correctly
- [ ] Verify database connections
- [ ] Test the main workflows

## Common Issues

### Build Fails
- Check if all dependencies are in package.json
- Verify Node.js version compatibility
- Check build logs for specific errors

### Database Connection Issues
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure RLS policies are configured

### Authentication Not Working
- Double-check Supabase URL and anon key
- Verify Supabase Auth settings
- Check redirect URLs in Supabase dashboard

## Backend Deployment (Separate)

The Python backend needs separate deployment:
- Option 1: Deploy to Railway/Render
- Option 2: Use Vercel Functions (requires adaptation)
- Option 3: Deploy to a VPS with Docker

## Support

For deployment issues:
1. Check Vercel build logs
2. Verify all environment variables
3. Test locally first with `npm run build`
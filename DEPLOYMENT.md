# Deployment Guide - Vercel (Free)

## Quick Deploy to Vercel

Vercel offers a **completely free tier** perfect for this Next.js application.

### Step-by-Step Instructions:

1. **Go to Vercel**: https://vercel.com

2. **Sign up/Sign in**:
   - Click "Sign Up" or "Log In"
   - Choose "Continue with GitHub"
   - Authorize Vercel to access your GitHub account

3. **Import Your Repository**:
   - Click "Add New..." → "Project"
   - Find and select: `AppgradeAcademy/youth_konnect`
   - Click "Import"

4. **Configure Project** (usually auto-detected):
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add this variable:
     - **Name**: `DATABASE_URL`
     - **Value**: `postgresql://rzeszow_youth_user:gVIAC8suj2kw14bObW3Ws2rUFRTrtojn@dpg-d5dq5gali9vc73dn9rb0-a.frankfurt-postgres.render.com/rzeszow_youth`
     - **Environments**: Production, Preview, Development (select all)
   - Click "Save"

6. **Push Database Schema** (Important!):
   - After deployment, you need to run database migrations
   - Option 1: Run locally and push schema:
     ```bash
     npx prisma db push
     ```
   - Option 2: Use Vercel CLI (if installed):
     ```bash
     vercel env pull .env.local
     npx prisma db push
     ```

6. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for the build to complete
   - Your app will be live at: `https://youth-konnect.vercel.app` (or similar)

### Post-Deployment:

After deployment, you may need to run Prisma migrations:
- Vercel will run `npm run build` which includes Prisma generate
- Make sure your database schema is up to date

### Custom Domain (Optional):

You can add a custom domain in Vercel dashboard:
- Settings → Domains
- Add your domain name

### Free Tier Limits:

✅ Unlimited deployments  
✅ 100GB bandwidth/month  
✅ Perfect for small to medium projects  
✅ Automatic HTTPS  
✅ Global CDN  

## Alternative: Netlify (Also Free)

1. Go to https://netlify.com
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add environment variable: `DATABASE_URL`
7. Deploy!


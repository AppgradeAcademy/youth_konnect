# How to Add Your Images

## Step-by-Step Instructions

1. **Navigate to the images folder**
   - Go to: `public/images/` folder in your project

2. **Add your logo file**
   - Name it exactly: `logo.png`
   - Place it in: `public/images/logo.png`
   - Format: PNG
   - Recommended size: 150x50px or similar

3. **Add your banner file**
   - Name it exactly: `banner.jpeg` (or `banner.jpg`)
   - Place it in: `public/images/banner.jpeg` (or `banner.jpg`)
   - Supported formats: JPEG, JPG, PNG
   - Recommended size: 1920x600px or similar

4. **File Structure**
   ```
   public/
     images/
       logo.png        ← Your logo here
       banner.png      ← Your banner here
   ```

## Quick Copy Instructions

If you have your images ready:

1. Copy your logo file
2. Paste it into: `public/images/`
3. Rename it to: `logo.png`

4. Copy your banner file
5. Paste it into: `public/images/`
6. Rename it to: `banner.png`

## Verification

After adding the images:
1. Restart your development server: `npm run dev:3002`
2. Check the homepage - you should see your banner
3. Check the navigation bar - you should see your logo

If images don't appear:
- Check file names are exactly `logo.jpeg` and `banner.jpeg` (case-sensitive)
- Check files are in `public/images/` folder
- Check file permissions
- Restart the development server


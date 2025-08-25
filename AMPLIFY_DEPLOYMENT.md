# AWS Amplify Deployment Guide

## Prerequisites
- AWS Account
- GitHub repository (push your code first)

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Amplify deployment"
git push origin main
```

### 2. Deploy to Amplify
1. Go to AWS Amplify Console
2. Click "New app" > "Host web app"
3. Connect your GitHub repository
4. Select branch: `main`
5. Build settings will auto-detect from `amplify.yml`
6. Add environment variables:
   - `REACT_APP_SUPABASE_URL`: https://szdqpddrjjfhtsfgapdc.supabase.co
   - `REACT_APP_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6ZHFwZGRyampmaHRzZmdhcGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODUzMTIsImV4cCI6MjA2ODg2MTMxMn0.z6hj25tmUyfjT_tyeoBIlUn1dLMh0ARo3rOzwkMuosc
7. Click "Save and deploy"

### 3. Backend Considerations
Since your app uses Supabase for data storage, the backend server is optional for basic functionality. If you need the backend features (OpenAI, Rekognition, etc.), consider:

- Deploy backend to AWS Lambda + API Gateway
- Use AWS App Runner for containerized deployment
- Deploy to EC2 instance

### 4. Domain Setup (Optional)
- Add custom domain in Amplify console
- Configure SSL certificate (automatic with Amplify)

## Notes
- Frontend will be served from CloudFront CDN
- Automatic deployments on git push
- Built-in CI/CD pipeline
- Free tier includes 1000 build minutes/month
# Hospital Kiosk AI with AKOOL Talking Avatar

This project implements a hospital kiosk system with an AI-powered talking avatar using AKOOL's technology.

## AKOOL Integration

The project has been updated to use AKOOL's talking avatar technology instead of Ready Player Me. The key changes include:

1. Created a new `AkoolAvatarViewer` component that displays video-based avatars
2. Updated the `PatientForm` component to use AKOOL for speech synthesis
3. Implemented backend proxy for AKOOL API calls

## Setup

1. Make sure you have an AKOOL API key in your `.env` file:

```
AKOOL_CLIENT_ID=your_akool_api_key
```

2. Install dependencies:

```
npm install
```

3. Start the backend server:

```
cd backend
npm start
```

4. Start the frontend:

```
cd frontend
npm start
```

## How It Works

1. The system uses AKOOL's API to generate talking avatar videos
2. The backend proxies requests to AKOOL to keep API keys secure
3. The frontend displays the videos in the `AkoolAvatarViewer` component

## Key Components

- `AkoolAvatarViewer.jsx`: Displays the AKOOL avatar videos
- `PatientForm.jsx`: Handles patient registration with AKOOL avatar integration
- `akool.js` (frontend service): Provides functions to interact with AKOOL
- `akool.js` (backend route): Proxies requests to AKOOL API
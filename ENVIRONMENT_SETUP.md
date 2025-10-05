# Environment Setup

## Firebase Configuration

This project uses Firebase for authentication and database services. To set up the environment variables:

1. Create environment file:
   ```bash
   .env
   ```

2. Open the `.env` file and replace the placeholder values with your actual Firebase configuration:

   ```env
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

3. Get your Firebase configuration from the Firebase Console:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click on the web app icon or add a new web app
   - Copy the configuration values

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already included in `.gitignore`
- Use the `env.example` file as a template for other developers

## Development

After setting up your `.env` file, you can start the development server:

```bash
cd frontend
npm install
npm run dev
```

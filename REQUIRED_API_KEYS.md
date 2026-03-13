# Required API Keys for Prodigy95OS

When you are ready, you will need to gather the following configuration keys and add them to a `.env.local` file in the root of the project.

### 1. Firebase (Database & Authentication)
To get these keys:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and follow the steps to create a new project.
3. Once the project is created, click the **Web icon (`</>`)** on the Project Overview page to add a Web App.
4. Register the app (you don't need Firebase Hosting).
5. Firebase will show you a `firebaseConfig` object with your keys. Copy those values into your `.env.local` file as shown below:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

**Firebase Setup Required in Console:**
- **Authentication**: Go to "Build" > "Authentication" > "Sign-in method" > Add **Google** and enable it.
- **Firestore Database**: Go to "Build" > "Firestore Database" > "Create Database". Start in test mode for development.

### 2. AI & Scraping (The Desktop Apps)
- **`GEMINI_API_KEY`**: Your Google Gemini API key (from [Google AI Studio](https://aistudio.google.com/apikey)) for the YouTube Summarizer. Create a key by clicking "Create API Key" and selecting your project.
- **`FIRECRAWL_API_KEY`**: Your Firecrawl API key (from [Firecrawl](https://www.firecrawl.dev/)) for the AI Job Search application.
- **`GROQ_API_KEY`**: (Optional, kept for future use) Your Groq API key from [Groq Console](https://console.groq.com/).

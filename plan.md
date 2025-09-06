RoastIt App — Plan.md (Updated with AI Image Generation) 

1. Tech Stack 

Frontend (Mobile App): React Native (Expo SDK 53) → iOS + Android 

Frontend (Web App): Lightweight React (or plain HTML/JS) → Hosted on Vercel (roast links) 

Backend/DB: Supabase (Database + Auth + Storage + Functions) 

Auth: Supabase Auth (anonymous + optional Google/Apple login later) 

Hosting: Vercel for roast links (roastit.link/xyz123) 

Storage: Supabase Storage (for uploaded photos, private, using signed URLs) 

AI Image Generation: Gemini 2.5 Flash Image Preview model → generates roasted/edited images based on User 2 submissions

**CRITICAL RULE: NEVER CHANGE THE AI MODEL**
- Gemini 2.5 Flash Image Preview works perfectly and generates images correctly
- Any issues are code implementation problems in nano-banana function, NOT model problems
- Always use Gemini 2.5 Flash Image Preview - NEVER suggest changing to other models 

 
 

2. Core Features 

🔹 User 1 (Creator) 

Uploads a photo inside the mobile app only. 

Generates a unique roast link (example: roastit.link/abc123). 

Shares the link to Instagram/Snapchat/WhatsApp stories. 

Receives all roast submissions and AI-generated roasted images in their inbox inside the app. 

🔹 User 2 (Responder) 

Taps the shared link → opens web page (Vercel). 

Web client fetches User 1’s photo from Supabase using the link. 

Submits roast text. 

Supabase triggers NanoBanana Google AI model → generates roasted/edited image. 

Data (text + AI-generated image) goes to Supabase → shows up in User 1’s inbox. 

After submitting → sees CTA: 
"🔥 Get your own roast!" (Animation: Pulse / Breathing effect) 

Redirected to App Store / Play Store if tapped. 

Signed URL Expiration: 

Image URL valid for 5 minutes. 

If expired → prompt user: "Go back to the story and click the link again." 

 
 

3. Viral Loop 

User 1 posts roast link → gets roasts. 

User 2 taps → submits roast → AI-generated image created. 

User 2 sees “Get your own roast!” CTA → downloads app. 

User 2 becomes User 1. 

Loop repeats. 

 
 

4. User Flows 

Mobile App 

Onboarding: Quick intro screens. Login/signup optional. 

Main Screen: Upload photo → generate roast link → copy/share button. 

Inbox Screen: Shows all roast submissions. When a user taps on a submission, it will open a detailed view displaying the AI-generated image alongside the prompt submitted by User 2. Users can then share the result. 

Web App (Vercel) 

Link Page (roastit.link/abc123): 

Fetches User 1’s uploaded photo from Supabase. 

Input box: “Roast this photo 👀” 

Submit button → saves roast to Supabase + triggers AI generation. 

Thank You Page: 

“Your roast was sent ✅” 

“🔥 Get your own roast!”; Pulse/Breathing animation 

Redirected to App Store / Play Store if tapped. 

Signed URL Expiration: 

URL valid for 5 minutes. 

If expired → prompt user: "Go back to the story and click the link again." 

 
 

5. Hosting Setup 

Mobile App: Built with Expo SDK 53. 

Web App (Vercel): 

Each web client is self-contained, no shared code with mobile. 

Independent folder: /web 

Steps: 

Build lightweight web client (npm run build). 

Deploy folder /web to Vercel. 

Map domain: roastit.link → Vercel. 

Supabase Storage: 

Private storage for photos. 

Signed URLs used to allow web client temporary access. 

AI Integration: 

NanoBanana Google model used for generating roasted images. 

Triggered by new roast submission from User 2. 

Generated images stored in Supabase → delivered to User 1 inbox. 

 
 

6. Next Steps (MVP Roadmap) 

🔧 Setup Supabase project (Auth, Database, Storage). 

📱 Build React Native app: photo upload → link generation → inbox. 

🌐 Build minimal web client: fetch photo + roast input + thank you page/CTA. 

🚀 Integrate sharing flow to Instagram/Snap/WhatsApp. 

🔁 Test viral loop with friends → refine. 

✅ Ensure signed URL expires after 5 minutes → prompt users to go back to story if expired. 

🗂 Keep mobile + web folders completely independent → no shared files. 

🖼 Integrate NanoBanana Google AI model → generate roasted/edited images for User 1 inbox. 

 
 

7. Detailed AI Interaction Flow

This section details the end-to-end user journey involving the AI image generation.

1.  **Creation (User 1 - Mobile App)**:
    *   User 1 uploads a photo and selects a prompt (e.g., "Roast this photo").
    *   The app generates a unique URL (e.g., `roastd.link/unique-pic-id`) and copies it to the clipboard.
    *   User 1 shares the captured image (with the prompt overlay) directly to their Instagram Story, then pastes the link from their clipboard as a sticker.

2.  **Interaction (User 2 - Web)**:
    *   User 2 sees the story and clicks the link.
    *   They are taken to the web page (`roastd.link/unique-pic-id`), which displays the same photo and prompt.
    *   User 2 enters their own roast/prompt and submits it.

3.  **Processing (Backend - Supabase & AI)**:
    *   The submission from User 2 triggers a Supabase function.
    *   This function sends the original image and User 2's prompt to the 'NanoBanana' AI service.
    *   The AI service transforms the image based on the prompt and returns the new, generated image.

4.  **Delivery (User 1 - Mobile App)**:
    *   The AI-generated image and the associated prompt from User 2 are saved to Supabase and appear in User 1's in-app inbox.

5.  **Completion (User 1 - Mobile App)**:
    *   User 1 can view the generated image in their inbox and share it back to their own Instagram Story, completing the loop.

 
 

Folder Structure Suggestion: 

/roastit 
  /mobile      → React Native app (Expo SDK 53) 
  /web         → React web client (Vercel) 

Mobile and web communicate only via Supabase backend (DB + Storage + AI triggers). 

No shared components → safe to separate or deploy independently. 

 
 


 
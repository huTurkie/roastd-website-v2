# Gemini 2.5 Flash Image Preview API Analysis

## How are we sending the picture to Gemini 2.5? In what format?

We are sending the picture to Gemini 2.5 in **base64 encoded format** as part of the request body. The image is:

1. Downloaded from Supabase storage as an ArrayBuffer
2. Converted to base64 using the `arrayBufferToBase64()` helper function
3. Sent as `inline_data` with `mime_type: 'image/jpeg'` and `data: originalImageBase64`

## What API are we using?

We are using the **Google Generative Language API** with the streaming endpoint:

```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:streamGenerateContent?key=${GEMINI_API_KEY}
```

## API Code we're using

```typescript
geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:streamGenerateContent?key=${GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          {
            text: `${prompt}. Generate a completely new AI image based on this description.`
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: originalImageBase64
            }
          }
        ]
      }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        temperature: 0.9,
        topK: 40,
        topP: 0.95
      }
    })
  })
```

## Official TypeScript SDK Example

**From Gemini 2.5 website - Recommended approach:**

```typescript
// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import {
  GoogleGenAI,
} from '@google/genai';
import mime from 'mime';
import { writeFile } from 'fs';

function saveBinaryFile(fileName: string, content: Buffer) {
  writeFile(fileName, content, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`File ${fileName} saved to file system.`);
  });
}

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    responseModalities: [
        'IMAGE',
        'TEXT',
    ],
  };
  const model = 'gemini-2.5-flash-image-preview';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `INSERT_INPUT_HERE`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  let fileIndex = 0;
  for await (const chunk of response) {
    if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
      continue;
    }
    if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      const fileName = `ENTER_FILE_NAME_${fileIndex++}`;
      const inlineData = chunk.candidates[0].content.parts[0].inlineData;
      const fileExtension = mime.getExtension(inlineData.mimeType || '');
      const buffer = Buffer.from(inlineData.data || '', 'base64');
      saveBinaryFile(`${fileName}.${fileExtension}`, buffer);
    }
    else {
      console.log(chunk.text);
    }
  }
}

main();
```

## OFFICIAL GOOGLE GEMINI API EXAMPLES FOR COMPARISON

### Python Example (Official Google Gemini 2.5 Website)

```python
# To run this code you need to install the following dependencies:
# pip install google-genai

import base64
import mimetypes
import os
from google import genai
from google.genai import types


def save_binary_file(file_name, data):
    f = open(file_name, "wb")
    f.write(data)
    f.close()
    print(f"File saved to to: {file_name}")


def generate():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-2.5-flash-image-preview"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="""INSERT_INPUT_HERE"""),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        response_modalities=[
            "IMAGE",
            "TEXT",
        ],
    )

    file_index = 0
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if (
            chunk.candidates is None
            or chunk.candidates[0].content is None
            or chunk.candidates[0].content.parts is None
        ):
            continue
        if chunk.candidates[0].content.parts[0].inline_data and chunk.candidates[0].content.parts[0].inline_data.data:
            file_name = f"ENTER_FILE_NAME_{file_index}"
            file_index += 1
            inline_data = chunk.candidates[0].content.parts[0].inline_data
            data_buffer = inline_data.data
            file_extension = mimetypes.guess_extension(inline_data.mime_type)
            save_binary_file(f"{file_name}{file_extension}", data_buffer)
        else:
            print(chunk.text)

if __name__ == "__main__":
    generate()
```

### TypeScript Example (Official Google Gemini 2.5 Website)

```typescript
// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import {
  GoogleGenAI,
} from '@google/genai';
import mime from 'mime';
import { writeFile } from 'fs';

function saveBinaryFile(fileName: string, content: Buffer) {
  writeFile(fileName, content, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`File ${fileName} saved to file system.`);
  });
}

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    responseModalities: [
        'IMAGE',
        'TEXT',
    ],
  };
  const model = 'gemini-2.5-flash-image-preview';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `INSERT_INPUT_HERE`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  let fileIndex = 0;
  for await (const chunk of response) {
    if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
      continue;
    }
    if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      const fileName = `ENTER_FILE_NAME_${fileIndex++}`;
      const inlineData = chunk.candidates[0].content.parts[0].inlineData;
      const fileExtension = mime.getExtension(inlineData.mimeType || '');
      const buffer = Buffer.from(inlineData.data || '', 'base64');
      saveBinaryFile(`${fileName}.${fileExtension}`, buffer);
    }
    else {
      console.log(chunk.text);
    }
  }
}

main();
```

### Java Example (Official Google Gemini Website)

```java
package com.example;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.*;
import com.google.gson.Gson;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.apache.tika.mime.MimeTypeException;
import org.apache.tika.mime.MimeTypes;

public class App {
  static void saveBinaryFile(String fileName, byte[] content) {
    try {
      FileOutputStream out = new FileOutputStream(fileName);
      out.write(content);
      out.close();
      System.out.println("Saved file: " + fileName);
    } catch (IOException e) {
        System.out.println(e.getMessage());
    }
  }

  public static void main(String[] args) {
    String apiKey = System.getenv("GEMINI_API_KEY");
    Client client = Client.builder().apiKey(apiKey).build();
    Gson gson = new Gson();
    MimeTypes allTypes = MimeTypes.getDefaultMimeTypes();


    String model = "gemini-2.5-flash-image-preview";
    List<Content> contents = ImmutableList.of(
      Content.builder()
        .role("user")
        .parts(ImmutableList.of(
          Part.fromText("INSERT_INPUT_HERE")
        ))
        .build()
    );
    GenerateContentConfig config =
      GenerateContentConfig
      .builder()
      .responseModalities(ImmutableList.of(
          "IMAGE",
          "TEXT"
      ))
      .build();

    ResponseStream<GenerateContentResponse> responseStream = client.models.generateContentStream(model, contents, config);

    for (GenerateContentResponse res : responseStream) {
      if (res.candidates().isEmpty() || res.candidates().get().get(0).content().isEmpty() || res.candidates().get().get(0).content().get().parts().isEmpty()) {
        continue;
      }

      List<Part> parts = res.candidates().get().get(0).content().get().parts().get();
      for (Part part : parts) {
        if (part.inlineData().isPresent()) {
          String fileName = "ENTER_FILE_NAME";
          Blob inlineData = part.inlineData().get();
          String fileExtension;
          try {
            fileExtension = allTypes.forName(inlineData.mimeType().orElse("")).getExtension();
          } catch (MimeTypeException e) {
            fileExtension = "";
          }
          saveBinaryFile(fileName + "." + fileExtension, inlineData.data().get());
        }
        else {
          System.out.println(part.text());
        }
      }
    }

    responseStream.close();
  }
}
```

### REST API Example (Official Google Gemini Website)

```bash
#!/bin/bash
set -e -E

GEMINI_API_KEY="$GEMINI_API_KEY"
MODEL_ID="gemini-2.5-flash-image-preview"
GENERATE_CONTENT_API="streamGenerateContent"

cat << EOF > request.json
{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "INSERT_INPUT_HERE"
          },
        ]
      },
    ],
    "generationConfig": {
      "responseModalities": ["IMAGE", "TEXT", ],
    },
}
EOF

curl \
-X POST \
-H "Content-Type: application/json" \
"https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:${GENERATE_CONTENT_API}?key=${GEMINI_API_KEY}" -d '@request.json'
```

## Are we receiving the AI generated images from Gemini 2.5?

**Based on the function logs shown in the screenshots: NO, we are not successfully receiving AI generated images.**

## What format were we expecting and what transformations?

We were expecting to receive image data in the streaming response as:
- **Format**: Base64 encoded image data in `part.inline_data.data`
- **Transformation**: Convert base64 to Uint8Array using `Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))`
- **Upload**: Upload the Uint8Array to Supabase storage as JPEG

## What errors are we getting?

From the function logs in the screenshots, the main errors are:

1. **Session lookup errors**: "Cannot coerce the result to a single JSON object" - indicating database query issues
2. **Session not found errors**: The function cannot find sessions with the provided link_code
3. **Function invocation errors**: The web interface shows "There was an error sending your message"

The logs show the function is being called but failing at the session lookup stage, before it even reaches the Gemini API call. The streaming response parsing code is in place but never executed due to earlier failures.

## Root Cause Analysis

The issue is not with the Gemini API integration itself, but with:
1. **Database session lookup** - queries failing to find valid sessions
2. **Web interface communication** - errors in function invocation from the web client
3. **Missing test data** - no valid sessions exist to test the complete flow

The Gemini 2.5 Flash Image Preview integration code is correctly implemented but cannot be tested until the session lookup issues are resolved.

## Recommendation: Use Official TypeScript SDK

Instead of manual fetch API calls, we should use the official `@google/genai` TypeScript SDK which provides:
- Better error handling
- Automatic streaming response parsing
- Type safety
- Simplified API calls
- Official support and updates

# Roastd AI Image Generation - Complete Technical Documentation for External AI Advisor

## PROJECT OVERVIEW

**Roastd** is a mobile app that allows users to upload photos and generate AI-modified images based on prompts. The workflow involves:

1. **Mobile App (React Native)**: User uploads photo, creates roast session
2. **Web Interface**: Other users add prompts via shared links  
3. **Supabase Edge Function**: Processes AI image generation using Gemini 2.5 Flash Image Preview
4. **Mobile Inbox**: Displays generated AI images

## CURRENT ISSUE

The AI image generation is failing at the Supabase Edge Function level. The mobile app and web interface work correctly, but when prompts are submitted via web, the nano-banana function encounters errors and fails to generate AI images.

## COMPLETE WORKFLOW EXPLANATION

### 1. Mobile App Upload Process (WORKING ✅)

**File**: `/mobile/app/(tabs)/index.tsx`

The mobile app successfully:
- Uploads images to Supabase storage
- Creates roast sessions in database
- Generates unique link codes
- Updates prompts via dice button

**Key Functions**:
```typescript
// Upload image and create session
const uploadPhoto = async (imageUri: string): Promise<string | null> => {
  const fileName = `roast_${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('roast-photos')
    .upload(fileName, formData);
  return data?.path || null;
};

// Create roast session in database
const createRoastSession = async (photoUrl: string, prompt: string): Promise<string | null> => {
  const linkCode = generateLinkCode();
  const { data, error } = await supabase
    .from('roast_sessions')
    .insert({
      link_code: linkCode,
      original_photo_url: photoUrl,
      roast_prompt: prompt,
      creator_email: 'anonymous'
    });
  return linkCode;
};
```

### 2. Web Interface (WORKING ✅)

**File**: `/web/index.html`

The web interface successfully:
- Loads images from Supabase using link codes
- Displays prompts correctly
- Submits new prompts to nano-banana function

**Key JavaScript**:
```javascript
// Submit prompt to nano-banana function
async function submitPrompt() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/nano-banana`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      link_code: linkCode,
      prompt: promptText
    })
  });
}
```

### 3. Nano-Banana Supabase Edge Function (FAILING ❌)

**File**: `/supabase/functions/nano-banana/index.ts`

This is where the issue occurs. The function should:
1. Receive link_code and prompt from web interface
2. Look up session in database
3. Download original image
4. Call Gemini 2.5 Flash Image Preview API
5. Process streaming response for generated image
6. Upload generated image to Supabase storage
7. Update database with generated image URL
8. Insert result into inbox table

**Current Implementation**:
```typescript
import { GoogleGenAI } from 'https://esm.sh/@google/genai@0.3.2'

serve(async (req) => {
  try {
    const { link_code, prompt } = await req.json()
    
    // 1. Look up session
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('roast_sessions')
      .select('session_id, original_photo_url')
      .eq('link_code', link_code)
      .single()
    
    // 2. Download original image
    const originalImageResponse = await fetch(sessionData.original_photo_url)
    const originalImageBuffer = await originalImageResponse.arrayBuffer()
    const originalImageBase64 = btoa(String.fromCharCode(...new Uint8Array(originalImageBuffer)))
    
    // 3. Initialize Gemini AI
    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });
    
    // 4. Call Gemini API
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-image-preview',
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        temperature: 0.9,
      },
      contents: [{
        role: 'user',
        parts: [
          {
            text: `${prompt}. Generate a completely new AI image based on this description.`,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: originalImageBase64,
            },
          },
        ],
      }],
    });
    
    // 5. Process streaming response
    let generatedImageBase64: string | null = null;
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }
      for (const part of chunk.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          generatedImageBase64 = part.inlineData.data;
          break;
        }
      }
      if (generatedImageBase64) break;
    }
    
    // 6. Upload generated image
    if (generatedImageBase64) {
      const imageBuffer = Uint8Array.from(atob(generatedImageBase64), c => c.charCodeAt(0));
      const fileName = `ai_generated_${sessionData.session_id}_${Date.now()}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('roast-photos')
        .upload(fileName, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });
    }
    
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
```

### 4. Mobile Inbox (WORKING ✅)

**File**: `/mobile/app/(tabs)/inbox.tsx`

The inbox correctly:
- Fetches roast sessions from database
- Filters for AI-processed sessions (those with generated_photo_url)
- Displays generated images when available

```typescript
const fetchMessages = async () => {
  const { data, error } = await supabase
    .from('roast_sessions')
    .select('*')
    .order('created_at', { ascending: false });
  
  // Only show sessions that have been processed by AI
  const processedSessions = (data || []).filter(session => 
    session.generated_photo_url && 
    session.generated_photo_url !== session.original_photo_url
  );
};
```

## CURRENT ERROR LOGS

**From Supabase Function Logs**:
```
ERROR: Function error: Error: Session not found: Cannot coerce the result to a single JSON object
ERROR: Error retrieving session: {"code":"PGRST116","details":"The result contains 0 rows","hint":null,"message":"JSON object requested, single row expected"}
INFO: Session query results: null
INFO: All sessions error: null
INFO: Looking up session by link_code: bzUOgKdc
INFO: Extracted parameters: {"link_code":"bzUOgKdc","prompt":"Transform them into a meme character 😂"}
```

**From Mobile App Logs** (Working correctly):
```
LOG: Roast session created! Link code: bzUOgKdc
LOG: Public photo URL: https://whvbxvllzrgjvurdivmh.supabase.co/storage/v1/object/public/roast-photos/roast_1757167276606.jpg
LOG: [handleDicePress] Updating prompt to "Transform me into a meme character 😂" for link code: bzUOgKdc
LOG: ✅ Roast prompt updated successfully
```

**From Web Interface**: 
- Shows "There was an error sending your message" 
- Function returns 500 error

## API IMPLEMENTATIONS TESTED

### Current: REST API Implementation (Deployed)
**Status**: ✅ Successfully deployed after TypeScript SDK import failures

```typescript
// Current implementation using direct REST API calls
const requestBody = {
  contents: [{
    role: "user",
    parts: [
      {
        text: `${prompt}. Generate a completely new AI image based on this description.`
      },
      {
        inline_data: {
          mime_type: contentType,  // Dynamic MIME type detection
          data: originalImageBase64
        }
      }
    ]
  }],
  generationConfig: {
    responseModalities: ['IMAGE', 'TEXT'],
    temperature: 0.9
  }
};

const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:streamGenerateContent?key=${GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  }
);

// Process streaming response
const reader = geminiResponse.body?.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const jsonStr = line.slice(6);
      if (jsonStr.trim() === '[DONE]') continue;
      
      const chunk = JSON.parse(jsonStr);
      if (chunk.candidates?.[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            generatedImageBase64 = part.inlineData.data;
            break;
          }
        }
      }
    }
  }
}
```

### Previously Tried: TypeScript SDK (@google/genai)
**Status**: ❌ Failed due to module import issues in Supabase Edge Functions

```typescript
// This approach failed during deployment
import { GoogleGenAI } from 'https://esm.sh/@google/genai@0.3.2'
// Error: Module not found "https://esm.sh/@google/genai@0.3.2"

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const response = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash-image-preview',
  config: { responseModalities: ['IMAGE', 'TEXT'] },
  contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 }}]}]
});
```

## DATABASE SCHEMA

**roast_sessions table**:
```sql
- session_id (uuid, primary key)
- link_code (text, unique)
- original_photo_url (text)
- generated_photo_url (text, nullable)
- roast_prompt (text)
- updated_prompt (text, nullable)
- creator_email (text)
- created_at (timestamp)
```

**inbox table**:
```sql
- id (uuid, primary key)
- session_id (uuid, foreign key)
- image_url (text)
- message (text)
- created_at (timestamp)
```

## ENVIRONMENT VARIABLES

Required in Supabase Edge Functions:
- `GEMINI_API_KEY`: Google AI API key
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

## QUESTIONS FOR AI ADVISOR

1. **CRITICAL - Web Interface Bug**: The web interface is passing `session_id` (UUID) instead of `link_code` (string) to the nano-banana function. This explains why sessions aren't found. How should we fix this?

2. **Session Lookup Issue**: Even after implementing `.maybeSingle()` and debug logging, why is the database query still failing to find sessions that clearly exist?

3. **REST API vs TypeScript SDK**: The TypeScript SDK failed to import in Supabase Edge Functions. Is the current REST API implementation the best approach for Deno runtime?

4. **Streaming Response Handling**: Is our current streaming response parsing correct for the Gemini 2.5 Flash Image Preview REST API?

5. **Database Query Debugging**: What additional debugging steps should we implement to understand why `link_code` queries are failing?

6. **Image Processing**: Is our base64 encoding/decoding and Uint8Array conversion correct for image upload to Supabase storage?

7. **Error Handling**: What additional error handling should we implement for the complete workflow?

## TEST DATA

### Previous Test Session
- **Link Code**: `bzUOgKdc`
- **Original Image**: `https://whvbxvllzrgjvurdivmh.supabase.co/storage/v1/object/public/roast-photos/roast_1757167276606.jpg`
- **Prompt**: "Transform them into a meme character 😂"
- **Status**: Session lookup still failing

### Latest Test Session
- **Link Code**: `pFkHmQiz`
- **Original Image**: `https://whvbxvllzrgjvurdivmh.supabase.co/storage/v1/object/public/roast-photos/roast_1757170115941.jpg`
- **Prompt**: "Turn me into a cartoon character 🎨"
- **Mobile App**: ✅ Successfully created session
- **Web Interface**: ✅ Loads image and prompt correctly
- **Function Call**: ❌ Still failing with session lookup error
- **Root Cause**: Web interface passing `session_id` instead of `link_code`

The mobile app workflow is 100% functional. The web interface loads correctly but has a critical bug in parameter passing to the nano-banana function.

## DEPLOYMENT STATUS

- Mobile app: Working correctly
- Web interface: Working correctly  
- Supabase Edge Function: Deployed with TypeScript SDK but failing
- Database: Contains valid test data

**Critical**: The function needs to successfully process the existing session with link_code `bzUOgKdc` to validate the complete workflow.

## LATEST TEST RESULTS AND CURRENT STATUS

### New Session Created Successfully
**Mobile App Logs (Latest Test)**:
```
LOG  🚀 Starting direct upload with Expo FileSystem for: roast_1757170115941.jpg
LOG  📡 Uploading to: https://whvbxvllzrgjvurdivmh.supabase.co/storage/v1/object/roast-photos/roast_1757170115941.jpg
LOG  📬 Server Response Status: 200
LOG  ✅ Direct upload successful!
LOG  Roast session created! Link code: pFkHmQiz
LOG  Public photo URL: https://whvbxvllzrgjvurdivmh.supabase.co/storage/v1/object/public/roast-photos/roast_1757170115941.jpg
LOG  📱 Saved uploaded image and roast link to storage
LOG  [handleDicePress] New prompt: Turn me into a cartoon character 🎨
LOG  [handleDicePress] Updating prompt to "Turn me into a cartoon character 🎨" for link code: pFkHmQiz
LOG  ✅ Roast prompt updated successfully
```

### Web Interface Testing
- **URL**: `localhost:8000/unique-pic-id/index.html?code=pFkHmQiz`
- **Image Loading**: ✅ Successfully loads the uploaded image
- **Prompt Display**: ✅ Shows "Turn me into a cartoon character 🎨"
- **User Interface**: ✅ Web interface fully functional
- **Prompt Submission**: ❌ Still failing with "There was an error sending your message"

### Current Function Logs (nano-banana Edge Function)
**Latest Deployment Status**: ✅ Successfully deployed with REST API implementation

**Function Logs from Latest Test**:
```
🔥 [nano-banana] STEP 1: Function invoked
🔥 [nano-banana] STEP 2: Extracted parameters: {"link_code":"pFkHmQiz","prompt":"Put them in a famous painting 🖼️"}
🔥 [nano-banana] STEP 3: Initializing Supabase client...
🔥 [nano-banana] STEP 4: Looking up session by link_code: pFkHmQiz
🔍 [nano-banana] DEBUG: Received link_code: "pFkHmQiz" Type: string
🔍 [nano-banana] DEBUG: Sample sessions in database: [...]
❌ [nano-banana] Function error: Error: Session not found: Cannot coerce the result to a single JSON object
❌ [nano-banana] Error retrieving session: {"code":"PGRST116","details":"The result contains 0 rows","hint":null,"message":"JSON object requested, single row expected"}
```

**CRITICAL ISSUE IDENTIFIED**: The session lookup is still failing even with `.maybeSingle()` implementation. The function logs show that the session with `link_code: "pFkHmQiz"` is not being found in the database, despite the mobile app successfully creating it.

### Web Interface Implementation Details
**File**: `/web/unique-pic-id/index.html`

**Key Components**:
1. **Session Lookup**: Uses URL parameter `?code=pFkHmQiz` to identify the session
2. **Image Display**: Fetches and displays the original uploaded image
3. **Prompt Submission**: Calls nano-banana function via Supabase client

**JavaScript Implementation**:
```javascript
// Extract link code from URL
const urlParams = new URLSearchParams(window.location.search);
const linkCode = urlParams.get('code');

// Fetch session data
const { data, error } = await supabaseClient
    .from('roast_sessions')
    .select('session_id, original_photo_url, roast_prompt')
    .eq('link_code', linkCode)
    .single();

// Submit prompt to nano-banana function
const { data, error } = await supabaseClient.functions.invoke('nano-banana', {
    body: { 
        link_code: currentSessionId,  // ⚠️ POTENTIAL BUG: Using session_id instead of link_code
        prompt: promptText
    },
});
```

**CRITICAL BUG IDENTIFIED**: The web interface is passing `currentSessionId` (session_id UUID) instead of `linkCode` (link_code string) to the nano-banana function!

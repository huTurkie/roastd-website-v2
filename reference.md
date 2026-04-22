# Database Schema Reference - Checkpoint V501

**Created:** 2025-01-18 01:28:00
**Purpose:** Backup reference before fixing nano-banana function errors

## Current Supabase Database Schema

### roast_sessions Table
```sql
CREATE TABLE roast_sessions (
  session_id TEXT PRIMARY KEY,
  link_code TEXT UNIQUE,
  original_photo_url TEXT,
  creator_email TEXT,
  username TEXT,
  roast_prompt TEXT,
  updated_prompt TEXT,
  ai_image_url TEXT,
  generated_photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### inbox Table
```sql
CREATE TABLE inbox (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  creator_email TEXT,
  username TEXT,
  roast_session_id TEXT,
  generated_photo_url TEXT,
  prompt TEXT,
  original_photo_url TEXT,
  recipient_identifier TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Current Function Logic (nano-banana)

### Key Steps:
1. Receives `link_code` and `prompt` from web form
2. Looks up original session by `link_code`
3. **CREATES NEW SESSION RECORD** with unique session_id
4. Generates AI image using Gemini API
5. Uploads image to Supabase storage
6. Updates new session record with image URL
7. Inserts record into inbox table

### Current Issues (from logs):
- Function errors during execution
- No messages appearing in inbox
- Possible schema mismatch or missing columns

## Mobile App Inbox Query
```typescript
// From inbox.tsx line 86-91
const { data, error } = await supabase
  .from('roast_sessions')
  .select('*')
  .eq('creator_email', userInfo.email)
  .not('ai_image_url', 'is', null)
  .order('created_at', { ascending: false });
```

## Storage Configuration
- Bucket: `roast-photos`
- File naming: `ai_generated_${session_id}_${timestamp}.jpg`

## Environment Variables Required
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY  
- GEMINI_API_KEY

## Rollback Instructions
If changes break functionality:
1. Revert to commit: `877c3f0` (Checkpoint V501)
2. Redeploy original nano-banana function
3. Restore original database schema if modified

## Working State Before Changes
- Instagram sharing: ✅ Working
- Image upload: ✅ Working  
- Basic inbox display: ✅ Working
- Multiple user handling: ❌ Overwriting (the issue we're fixing)

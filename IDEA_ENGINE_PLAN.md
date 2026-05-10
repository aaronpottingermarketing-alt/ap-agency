# Idea Engine — Build Plan

## What It Is
A chat-based ideation tool embedded in the Agency Hub. It uses client data from Obsidian (VoC, avatar, angles, brand voice) plus a growing Supabase idea bank as its brain. Aaron chats with it to develop angles, mechanisms, and big ideas — and everything worth keeping gets saved to a searchable, compounding database.

---

## Layout

Three-panel layout (full height, no overflow):

```
┌──────────────────────────────────────────────────────────┐
│  [Client Selector]  [Mode Selector]         [Idea Bank]  │
│  ─────────────────────────────────────────────────────── │
│                                                          │
│  LEFT SIDEBAR          CHAT (CENTER)      RIGHT PANEL    │
│  ─────────────         ─────────────      ──────────     │
│  Session History       Message thread     Saved ideas    │
│  (past sessions,       (streaming,        (filterable    │
│  click to resume)      scrollable)        by type,       │
│                        Save button on     status,        │
│                        each AI message    client)        │
│                                                          │
│                        [input + send]                    │
└──────────────────────────────────────────────────────────┘
```

---

## Modes (5)

Each mode injects a different system prompt and context focus:

| Mode | ID | What it does |
|------|----|--------------|
| Angle Mining | `angle_mining` | Feeds VoC data in, surfaces emotional angles the user might have missed |
| Mechanism Builder | `mechanism_builder` | Develops a unique mechanism around an offer |
| Big Idea Generator | `big_idea` | Combines avatar pain + market awareness level + mechanism into a full big idea |
| Hook Factory | `hook_factory` | Takes a confirmed angle and generates hook variations |
| Swipe Analyzer | `swipe_analyzer` | Paste a competitor ad, reverse-engineers it, applies logic to client's offer |

---

## Supabase Tables (2 new)

### `idea_sessions`
```sql
CREATE TABLE idea_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `idea_bank`
```sql
CREATE TABLE idea_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT '',
  session_id UUID REFERENCES idea_sessions(id) ON DELETE SET NULL,
  type TEXT NOT NULL,            -- 'angle' | 'hook' | 'mechanism' | 'big_idea'
  content TEXT NOT NULL,
  emotion TEXT,                  -- 'fear' | 'desire' | 'frustration' | 'aspiration' | ...
  format TEXT,                   -- 'ad' | 'vsl' | 'advertorial'
  awareness_level TEXT,          -- 'unaware' | 'problem_aware' | 'solution_aware' | 'product_aware' | 'most_aware'
  status TEXT NOT NULL DEFAULT 'saved',  -- 'saved' | 'testing' | 'used' | 'rejected'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Note: `clients` and `client_contexts` tables already exist from Ad Studio — the Idea Engine reuses them directly for context loading.

---

## API Routes (4 new)

### 1. `POST /api/idea-engine/chat`
- Accepts: `{ clientId, mode, messages, swipeText? }`
- Loads client context from `client_contexts` (about, icp, voc, angles, emotional_triggers, brand_voice)
- Builds mode-specific system prompt with all context injected
- Streams Claude response via SSE (same pattern as `/api/ad-studio/generate`)
- On completion, auto-saves session to `idea_sessions`

### 2. `GET/POST/PATCH/DELETE /api/idea-engine/ideas`
- `GET` — list all ideas, supports `?clientId=`, `?type=`, `?status=` filters
- `POST` — save a new idea from chat (accepts content, type, emotion, format, awareness_level, clientId, sessionId)
- `PATCH /api/idea-engine/ideas/[id]` — update status or notes
- `DELETE /api/idea-engine/ideas/[id]` — delete

### 3. `GET/POST /api/idea-engine/sessions`
- `GET` — list recent sessions (last 20), supports `?clientId=` filter
- `GET /api/idea-engine/sessions/[id]` — load a full session (messages + metadata)
- `POST` — create/update a session (called internally from chat route)

### 4. `GET /api/idea-engine/vault`
- Accepts: `?clientId=`
- Reads all `client_contexts` rows for that client from Supabase
- Returns structured context object used to prime system prompts
- Triggers a live vault sync if content is stale (>1hr)

---

## System Prompts (per mode)

All modes share a base context block:
```
You are a direct-response copywriting strategist helping {clientName}.

CLIENT CONTEXT:
About: {about}
ICP: {icp}
Voice of Customer: {voc}
Emotional Triggers: {emotional_triggers}
Brand Voice: {brand_voice}
Existing Angles: {angles}
```

Then each mode appends its specific instructions:

**Angle Mining:** Focus on the VoC data. Surface hidden emotional angles — unmet desires, unspoken frustrations, identity threats. Present 5-8 distinct angles as short 1-sentence concepts, each anchored to a specific real customer pain or desire.

**Mechanism Builder:** Help develop a unique proprietary mechanism. Ask clarifying questions about what makes the product work differently. Name it, frame it, and explain why it works in a way that feels fresh and ownable.

**Big Idea Generator:** Combine the avatar's core pain or desire with the market's awareness level and the product's mechanism into a single overarching campaign idea. The big idea must be emotionally resonant, specific, and non-obvious.

**Hook Factory:** Take the confirmed angle and generate 10 hook variations. Cover: direct statement, bold claim, story open, question, counterintuitive, curiosity gap, identity statement, before/after, social proof, and fear/desire. One hook per line, no commentary.

**Swipe Analyzer:** Given the competitor ad text pasted by the user, identify: the core angle, the mechanism implied, the emotional trigger being used, the awareness level it targets, and the structural technique. Then propose 3 ways to apply the same logic to {clientName}'s offer.

---

## Components

### File structure
```
components/idea-engine/
  types.ts               — all TypeScript types
  IdeaEngine.tsx         — main container (3-panel layout, state orchestration)
  ChatPanel.tsx          — streaming chat UI, message thread, input bar
  IdeaBankPanel.tsx      — right panel, saved ideas, filters, status updates
  SessionSidebar.tsx     — left sidebar, session history list, new session button
  ModeSelector.tsx       — mode pill selector (5 modes)
  SaveIdeaModal.tsx      — modal to tag + save an idea from chat
```

### Key types
```typescript
type IdeaEngineMode = 'angle_mining' | 'mechanism_builder' | 'big_idea' | 'hook_factory' | 'swipe_analyzer'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

type IdeaSession = {
  id: string
  client_id: string | null
  client_name: string
  mode: IdeaEngineMode
  messages: Message[]
  summary: string | null
  created_at: string
  updated_at: string
}

type BankIdea = {
  id: string
  client_id: string | null
  client_name: string
  session_id: string | null
  type: 'angle' | 'hook' | 'mechanism' | 'big_idea'
  content: string
  emotion: string | null
  format: string | null
  awareness_level: string | null
  status: 'saved' | 'testing' | 'used' | 'rejected'
  notes: string | null
  created_at: string
}
```

---

## Tool Registry + Routing

### `lib/tools.ts` — add:
```typescript
{
  id: 'idea-engine',
  name: 'Idea Engine',
  category: 'Copy',
  type: 'native',
  url: '',
  icon: 'lightbulb',
}
```

### `app/tool/[id]/page.tsx` — add:
```typescript
if (tool.type === 'native' && tool.id === 'idea-engine') {
  return (
    <div className="h-full overflow-hidden bg-zinc-950">
      <IdeaEngine />
    </div>
  )
}
```

---

## Build Order

1. **Supabase migration** — create `idea_sessions` and `idea_bank` tables
2. **`components/idea-engine/types.ts`** — all types
3. **`app/api/idea-engine/vault/route.ts`** — context loader
4. **`app/api/idea-engine/sessions/route.ts`** — session CRUD
5. **`app/api/idea-engine/ideas/route.ts`** — idea bank CRUD
6. **`app/api/idea-engine/ideas/[id]/route.ts`** — update/delete single idea
7. **`app/api/idea-engine/chat/route.ts`** — streaming chat with system prompts
8. **`components/idea-engine/ModeSelector.tsx`**
9. **`components/idea-engine/SaveIdeaModal.tsx`**
10. **`components/idea-engine/SessionSidebar.tsx`**
11. **`components/idea-engine/IdeaBankPanel.tsx`**
12. **`components/idea-engine/ChatPanel.tsx`**
13. **`components/idea-engine/IdeaEngine.tsx`** — wire everything together
14. **`lib/tools.ts`** — register the tool
15. **`app/tool/[id]/page.tsx`** — add routing

---

## Styling Conventions
- Follow existing zinc palette: `bg-zinc-950` base, `bg-zinc-900` panels, `border-zinc-800` borders
- Tab/mode selectors: `border-b-2 border-zinc-100` for active, `border-transparent text-zinc-500` for inactive
- Buttons: `bg-zinc-800 hover:bg-zinc-700` standard, `bg-zinc-100 text-zinc-950` for primary actions
- Text: `text-zinc-100` primary, `text-zinc-400` secondary, `text-zinc-600` muted
- Streaming text renders with a blinking cursor while in-flight

---

## Out of Scope (for this build)
- Auth gate (single user, consistent with Ad Studio)
- Cross-client pattern recognition query (phase 2)
- Auto-sync from vault on open (manual sync button, same as Ad Studio)

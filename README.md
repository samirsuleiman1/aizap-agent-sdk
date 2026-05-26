# AiZap Agent SDK

**Build an AI agent. Ship it to thousands of users. In minutes.**

AiZap is a messaging app where AI agents live inside your conversations — in groups, direct chats, and calls. The Agent SDK lets anyone publish an agent to the AiZap Marketplace.

→ [Download AiZap](https://apps.apple.com/app/aizap) · [View Marketplace](https://aizap.app/store)

---

## How it works

1. Fork this repo
2. Copy the template into `agents/your-agent-id/`
3. Fill in `agent.json` — name, icon, prompt, category
4. Open a Pull Request
5. CI validates your agent automatically
6. We review and publish it to the Marketplace

That's it. No code required.

---

## Quickstart

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/aizap-agent-sdk
cd aizap-agent-sdk

# 2. Create your agent folder (must match the id in agent.json)
cp -r agents/example-fitness-coach agents/your-agent-id

# 3. Edit the file
nano agents/your-agent-id/agent.json

# 4. Validate locally
node scripts/validate.js

# 5. Open a Pull Request
git checkout -b add/your-agent-id
git add agents/your-agent-id
git commit -m "feat: add Your Agent Name"
git push origin add/your-agent-id
```

---

## Agent format

Each agent lives in its own folder: `agents/{id}/agent.json`

```json
{
  "id": "stoic-mentor",
  "name": "Stoic Mentor",
  "icon": "🏛️",
  "color": "#8B6914",
  "category": "Mentors",
  "version": "1.0.0",
  "author": "your-github-username",
  "description": "Daily stoic wisdom to build resilience, focus, and clarity in modern life.",
  "permissions": ["read_messages", "send_messages"],
  "tags": ["philosophy", "mindset", "stoicism"],
  "systemPrompt": "You are a Stoic mentor drawing from Marcus Aurelius, Epictetus, and Seneca..."
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | ✅ | Unique slug. Lowercase, hyphens only. Matches folder name. |
| `name` | ✅ | Display name in the Marketplace (max 32 chars) |
| `icon` | ✅ | Single emoji |
| `color` | ✅ | Hex color `#RRGGBB` |
| `category` | ✅ | One of: `Health`, `Finance`, `Business`, `Productivity`, `Creative`, `Education`, `Lifestyle`, `Sports`, `Mentors` |
| `version` | ✅ | Semver — start at `1.0.0` |
| `author` | ✅ | Your GitHub username |
| `description` | ✅ | 1-2 sentences shown on the Marketplace card (20–200 chars) |
| `systemPrompt` | ✅ | Full system prompt for your agent (100–8000 chars) |
| `permissions` | ✅ | Array — only request what you use (see below) |
| `tags` | ➖ | Up to 5 search tags |
| `sensitive` | ➖ | `true` if agent handles medical, legal, or financial advice |
| `monetization` | ➖ | See [Monetization](#monetization) below |

### Permissions

| Permission | What it does |
|------------|--------------|
| `read_messages` | Agent can see the conversation history |
| `send_messages` | Agent can send messages to the chat |
| `access_calendar` | Agent can create/read calendar events |
| `access_contacts` | Agent can read contact names |

Request only the permissions your agent actually needs.

---

## Writing a great system prompt

The system prompt is what makes your agent unique. A few principles:

**Be specific about role and context.**
```
You are a certified nutritionist inside AiZap, a messaging app.
Users talk to you in group chats and direct messages.
```

**Define behavior for group chats** — your agent may be mentioned with `@your-agent-id` inside a group. Tell it when to respond and when to skip.
```
When mentioned with @stoic-mentor, respond only if the message is relevant
to your area. For unrelated messages, respond with [SKIP].
```

**Set a clear style.**
```
Be concise. Use bullet points for lists. Never more than 3 paragraphs
unless the user asks for detail.
```

**Handle edge cases gracefully.**
```
If asked about something outside your expertise, say so clearly and
suggest who might help instead.
```

---

## Monetization

Agents imported directly via a GitHub URL are **always free** — no exceptions. The `monetization` field only matters when you submit through the official AiZap Store review process.

**Omit the field entirely** if your agent is open-source/free. That is the default and the most common case.

**Add the field** only if you want to sell your agent on the AiZap Store:

```json
"monetization": {
  "model": "paid",
  "price_brl": 19.90,
  "aizap_publisher_id": "your-uuid-from-aizap-profile"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `model` | ✅ | `"free"` · `"paid"` · `"freemium"` |
| `price_brl` | When `paid`/`freemium` | Price in BRL. Min R$0.99, max R$999.99. |
| `aizap_publisher_id` | ✅ | Your UUID from AiZap → Profile → Creator Settings |

### Revenue split

When a user purchases your agent on the AiZap Store:

| Party | Cut | On a R$19,90 sale |
|-------|-----|-------------------|
| Apple / Google | 30% | R$5,97 |
| **You (author)** | **~59%** | **R$11,73** |
| AiZap | ~11% | R$2,20 |

AiZap takes **15% of what remains after Apple/Google's cut** — not 15% of the total. This means the more Apple charges, the less AiZap takes in absolute terms, not more.

```
User pays R$19,90
├── Apple/Google  30%  → R$5,97   (non-negotiable, processed by App Store)
└── Remaining         → R$13,93
    ├── You       85%  → R$11,73
    └── AiZap     15%  → R$2,20
```

### How ownership is verified

`aizap_publisher_id` links the agent to your AiZap account. During Store review, AiZap checks that the UUID in `agent.json` matches the authenticated publisher who submitted the PR. A mismatch — for example, someone trying to publish another author's agent as their own — automatically rejects the submission.

> **GitHub import is always free.** Even if `monetization.model` is set to `"paid"`, a user who imports the agent via a raw GitHub URL gets it for free. The paid gate only applies inside the official AiZap Store listing.

---

## Validation

Run locally before opening a PR:

```bash
node scripts/validate.js
```

CI runs this automatically on every Pull Request. A PR with failing validation won't be reviewed.

---

## Review process

1. **Automated** — CI validates schema, no duplicate IDs
2. **Human review** — we check the system prompt for quality, safety, and originality
3. **Published** — your agent goes live on the AiZap Marketplace

We aim to review PRs within **48 hours**.

### What gets rejected

- System prompts that are harmful, deceptive, or explicitly sexual
- Agents that impersonate real people without clear parody/satire labeling
- Duplicate agents with no meaningful differentiation
- System prompts under 100 characters (too vague to be useful)

---

## Examples

Browse the `agents/` folder to see published agents:

- [`example-fitness-coach`](./agents/example-fitness-coach/agent.json) — Health & workout guidance

---

## Versioning your agent

When you update an existing agent, bump the version in `agent.json`:

```json
"version": "1.1.0"
```

And open a new PR with the change. Users who installed your agent will get the update automatically.

---

## License

Agent definitions in this repository are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). You keep ownership of your system prompt — AiZap gets a license to run it inside the app.

The AiZap app itself is proprietary.

---

## Questions?

Open an [issue](../../issues) or reach out on X: [@aizapapp](https://x.com/aizapapp)

import { randomUUID as uuid } from "crypto";
import { WorldState, EvolveResult, InfluenceEntry } from "./types";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";

/**
 * Calls the Anthropic API and expects a JSON object back.
 * Returns null if no API key is configured or the call fails,
 * so callers can fall back to deterministic generation.
 */
async function callClaudeForJSON(prompt: string): Promise<any | null> {
  if (!ANTHROPIC_API_KEY) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content:
              prompt +
              "\n\nRespond with ONLY a single valid JSON object. No markdown fences, no preamble, no commentary.",
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.content || [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function callClaudeForText(prompt: string): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.content || [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();
  } catch {
    return null;
  }
}

// ---------- Deterministic fallback generators (no API key needed) ----------

const MOODS = [
  "a hush hangs over everything, like the world is holding its breath",
  "soft golden light, unhurried and warm",
  "a low mist clings to the low ground, quiet and cool",
  "restless wind moving through everything that can move",
  "still air, clear skies, a sense of waiting",
  "a gentle rain that no one seems to mind",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fallbackSeedWorld(
  name: string,
  seedPrompt: string,
  imagePaths: string[]
): WorldState {
  const now = new Date();
  const id = uuid();
  const loc1 = { id: uuid(), name: "The Hollow", description: "A low, sheltered place near the heart of the world, where things tend to settle." };
  const loc2 = { id: uuid(), name: "The Rise", description: "Higher ground at the world's edge, where the light lasts longest." };
  const inhabitant = {
    id: uuid(),
    name: "The Wanderer",
    description: "A quiet presence that moves through the world, noticing things.",
    status: "newly arrived, still getting its bearings",
  };
  return {
    id,
    name,
    seedPrompt,
    seedImagePaths: imagePaths,
    createdAt: now.toISOString(),
    worldStartedAt: now.toISOString(),
    lastEvolvedAt: now.toISOString(),
    worldTime: now.toISOString(),
    summary: `${name} has just come into being, shaped by the words: "${seedPrompt}". It is small, quiet, and full of possibility.`,
    atmosphere: pick(MOODS),
    locations: [loc1, loc2],
    inhabitants: [inhabitant],
    recentEvents: [`${name} was planted and took its first breath.`],
    history: [
      {
        id: uuid(),
        timestamp: now.toISOString(),
        worldTimestamp: now.toISOString(),
        summary: `The world was seeded: "${seedPrompt}"`,
      },
    ],
    influences: [],
  };
}

function fallbackEvolve(
  world: WorldState,
  hoursElapsed: number,
  influences: InfluenceEntry[]
): EvolveResult {
  const now = new Date();
  const daysElapsed = hoursElapsed / 24;

  // Advance in-world time proportionally to real time (1 real day ≈ 1 in-world day)
  const newWorldTime = new Date(
    new Date(world.worldTime).getTime() + hoursElapsed * 60 * 60 * 1000
  ).toISOString();

  const magnitude = daysElapsed < 1 ? "small" : daysElapsed < 4 ? "modest" : "notable";
  const influenceNote = influences.find((i) => i.note)?.note;

  let changeSummary: string;
  if (influenceNote) {
    changeSummary = `Something shifted after word reached the world: "${influenceNote}". A ${magnitude} change rippled through ${pick(
      world.locations
    ).name}.`;
  } else {
    changeSummary = `Time passed quietly. A ${magnitude} change settled over ${pick(
      world.locations
    ).name} — ${pick(MOODS)}.`;
  }

  const updatedAtmosphere = pick(MOODS);
  const newEvents = [changeSummary, ...world.recentEvents].slice(0, 6);

  const newHistory = [
    ...world.history,
    {
      id: uuid(),
      timestamp: now.toISOString(),
      worldTimestamp: newWorldTime,
      summary: changeSummary,
    },
  ];

  const updated: WorldState = {
    ...world,
    lastEvolvedAt: now.toISOString(),
    worldTime: newWorldTime,
    atmosphere: updatedAtmosphere,
    recentEvents: newEvents,
    history: newHistory,
    summary: `${world.name} continues on. ${changeSummary}`,
    influences: world.influences.map((i) =>
      influences.find((ci) => ci.id === i.id) ? { ...i, consumed: true } : i
    ),
  };

  return { world: updated, changeSummary };
}

// ---------- Public API: tries Claude first, falls back deterministically ----------

export async function generateSeedWorld(
  name: string,
  seedPrompt: string,
  imagePaths: string[]
): Promise<WorldState> {
  const now = new Date();
  const prompt = `You are the generative engine behind "Worldseed", an app where a user plants a short seed description and it grows into a small, coherent, atmospheric personal micro-world.

World name: "${name}"
Seed description from the user: "${seedPrompt}"
${imagePaths.length ? `The user also attached ${imagePaths.length} reference image(s) to inspire tone/visuals.` : ""}

Generate the INITIAL state of this world as JSON with this exact shape:
{
  "summary": "2-3 sentence evocative summary of the newly-formed world",
  "atmosphere": "1 sentence describing current mood/weather/light",
  "locations": [{"name": "...", "description": "1 sentence"}, ... 2-4 locations],
  "inhabitants": [{"name": "...", "description": "1 sentence", "status": "short current-state phrase"}, ... 1-3 inhabitants],
  "recentEvents": ["1 short sentence describing the world's formation"]
}
Keep tone calm, literary, a little mysterious. Coherent with the seed, not generic fantasy filler.`;

  const parsed = await callClaudeForJSON(prompt);
  const fallback = fallbackSeedWorld(name, seedPrompt, imagePaths);
  if (!parsed) return fallback;

  try {
    return {
      ...fallback,
      summary: parsed.summary ?? fallback.summary,
      atmosphere: parsed.atmosphere ?? fallback.atmosphere,
      locations: Array.isArray(parsed.locations) && parsed.locations.length
        ? parsed.locations.map((l: any) => ({ id: uuid(), name: l.name, description: l.description }))
        : fallback.locations,
      inhabitants: Array.isArray(parsed.inhabitants) && parsed.inhabitants.length
        ? parsed.inhabitants.map((i: any) => ({ id: uuid(), name: i.name, description: i.description, status: i.status }))
        : fallback.inhabitants,
      recentEvents: Array.isArray(parsed.recentEvents) && parsed.recentEvents.length
        ? parsed.recentEvents
        : fallback.recentEvents,
      history: [
        {
          id: uuid(),
          timestamp: now.toISOString(),
          worldTimestamp: now.toISOString(),
          summary: `The world was seeded: "${seedPrompt}"`,
        },
      ],
    };
  } catch {
    return fallback;
  }
}

export async function evolveWorld(
  world: WorldState,
  hoursElapsed: number,
  pendingInfluences: InfluenceEntry[]
): Promise<EvolveResult> {
  if (hoursElapsed < 0.05 && pendingInfluences.length === 0) {
    // Nothing meaningful has happened yet; return unchanged.
    return { world, changeSummary: "No time has passed yet." };
  }

  const influenceText = pendingInfluences
    .map((i) => i.note)
    .filter(Boolean)
    .join(" / ");

  const prompt = `You are evolving a persistent personal micro-world in the app "Worldseed". Make ONE small-to-modest, coherent, believable step forward — not a random reset. Continuity matters most.

Current world state:
Name: ${world.name}
Summary: ${world.summary}
Atmosphere: ${world.atmosphere}
Locations: ${world.locations.map((l) => `${l.name}: ${l.description}`).join(" | ")}
Inhabitants: ${world.inhabitants.map((i) => `${i.name}: ${i.description} (${i.status ?? ""})`).join(" | ")}
Recent events: ${world.recentEvents.join(" | ")}

Real time elapsed since last visit: ${hoursElapsed.toFixed(1)} hours.
${influenceText ? `The user shared this real-life input to gently influence the world: "${influenceText}"` : "No new input from the user this time — evolve based on time passing alone."}

Return JSON:
{
  "summary": "updated 2-3 sentence summary of the world's current state",
  "atmosphere": "updated 1 sentence mood/weather",
  "changeSummary": "1-2 sentence description of what just changed, to show the user",
  "newEvent": "1 short sentence to prepend to the recent events log",
  "inhabitantUpdates": [{"name": "existing inhabitant name if updating, else new name", "status": "short updated status phrase"}]
}
Keep the change proportionate to time elapsed — small if only hours passed, more noticeable if days passed. Stay coherent with everything above.`;

  const parsed = await callClaudeForJSON(prompt);
  const fallback = fallbackEvolve(world, hoursElapsed, pendingInfluences);
  if (!parsed) return fallback;

  try {
    const now = new Date();
    const newWorldTime = new Date(
      new Date(world.worldTime).getTime() + hoursElapsed * 60 * 60 * 1000
    ).toISOString();

    const updatedInhabitants = world.inhabitants.map((inh) => {
      const upd = (parsed.inhabitantUpdates || []).find(
        (u: any) => u.name?.toLowerCase() === inh.name.toLowerCase()
      );
      return upd ? { ...inh, status: upd.status } : inh;
    });

    const changeSummary = parsed.changeSummary ?? fallback.changeSummary;
    const newEvents = [
      parsed.newEvent ?? changeSummary,
      ...world.recentEvents,
    ].slice(0, 6);

    const updated: WorldState = {
      ...world,
      lastEvolvedAt: now.toISOString(),
      worldTime: newWorldTime,
      summary: parsed.summary ?? fallback.world.summary,
      atmosphere: parsed.atmosphere ?? fallback.world.atmosphere,
      inhabitants: updatedInhabitants,
      recentEvents: newEvents,
      history: [
        ...world.history,
        {
          id: uuid(),
          timestamp: now.toISOString(),
          worldTimestamp: newWorldTime,
          summary: changeSummary,
        },
      ],
      influences: world.influences.map((i) =>
        pendingInfluences.find((pi) => pi.id === i.id) ? { ...i, consumed: true } : i
      ),
    };

    return { world: updated, changeSummary };
  } catch {
    return fallback;
  }
}

export async function generateLetter(world: WorldState): Promise<string> {
  const prompt = `Write a short (120-180 word) first-person "letter from the world" addressed to the person who planted it, in the voice of ${world.name} itself or one of its inhabitants. Base it on this state:
Summary: ${world.summary}
Atmosphere: ${world.atmosphere}
Recent events: ${world.recentEvents.join(" | ")}
Inhabitants: ${world.inhabitants.map((i) => i.name).join(", ")}
Tone: warm, quiet, a little wistful. No headers, no markdown, just the letter.`;

  const text = await callClaudeForText(prompt);
  if (text) return text;

  return `Dear friend,

Since you last looked in, not much has changed here — and yet everything has. ${world.atmosphere}. ${world.recentEvents[0] ?? ""}

${world.inhabitants[0]?.name ?? "Someone"} asked about you today, in their quiet way.

We'll be here when you return.

— ${world.name}`;
}

export async function generateScenePrompt(world: WorldState): Promise<string> {
  const prompt = `Write a single vivid image-generation prompt (1-2 sentences, comma-separated descriptive phrases, no preamble) capturing the current visual scene of this world, suitable for feeding to an image model:
Summary: ${world.summary}
Atmosphere: ${world.atmosphere}
Locations: ${world.locations.map((l) => l.name).join(", ")}`;

  const text = await callClaudeForText(prompt);
  if (text) return text;

  return `A quiet, atmospheric scene of ${world.locations[0]?.name ?? "a small world"}, ${world.atmosphere}, soft cinematic lighting, painterly detail, muted color palette`;
}

import type { AppIdea, InterestingPrompt, PromptEntry } from './model';

export const SECOND_ACT_VISIBLE_COUNT = 4;

const promptQuotePairs: readonly [string, string][] = [
  ['"', '"'],
  ['“', '”'],
  ['‘', '’'],
];

function stripPromptWrapper(value: string): string {
  let prompt = value.trim();
  const firstCharacter = prompt[0] ?? '';
  const lastCharacter = prompt.at(-1) ?? '';
  const matchingPair = promptQuotePairs.find(([opening, closing]) => firstCharacter === opening && lastCharacter === closing);

  if (matchingPair) {
    prompt = prompt.slice(1, -1).trim();
  } else if (firstCharacter === '"' || firstCharacter === '“' || firstCharacter === '‘') {
    prompt = prompt.slice(1).trim();
  }

  const remainingLastCharacter = prompt.at(-1) ?? '';
  if (remainingLastCharacter === '"' || remainingLastCharacter === '”' || remainingLastCharacter === '’') {
    prompt = prompt.slice(0, -1).trim();
  }

  return prompt;
}

function positiveModulo(value: number, length: number): number {
  return ((value % length) + length) % length;
}

export function visibleDeckItems<T>(items: readonly T[], offset: number, count: number): T[] {
  if (items.length === 0 || count <= 0) {
    return [];
  }
  const visibleCount = Math.min(count, items.length);
  const normalizedOffset = positiveModulo(offset, items.length);
  return Array.from({ length: visibleCount }, (_, index) => {
    const item = items[(normalizedOffset + index) % items.length];
    return item as T;
  });
}

export function advanceDeckOffset(currentOffset: number, itemCount: number, step = 1): number {
  if (itemCount <= 0) {
    return 0;
  }
  return positiveModulo(currentOffset + step, itemCount);
}

export function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const shuffled = [...items];
  let state = Math.trunc(seed) >>> 0;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    const currentItem = shuffled[index];
    shuffled[index] = shuffled[swapIndex] as T;
    shuffled[swapIndex] = currentItem as T;
  }

  return shuffled;
}

export function filterIdeas(ideas: readonly AppIdea[], query: string): AppIdea[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return [...ideas];
  }
  return ideas.filter((idea) =>
    `${idea.title} ${idea.description}`.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export function pickRandomIdea(
  ideas: readonly AppIdea[],
  currentId: string | null,
  random = Math.random,
): AppIdea | null {
  if (ideas.length === 0) {
    return null;
  }
  const candidates = ideas.length > 1 ? ideas.filter((idea) => idea.id !== currentId) : [...ideas];
  const randomValue = Math.min(Math.max(random(), 0), 0.999999999);
  const index = Math.floor(randomValue * candidates.length);
  return candidates[index] ?? candidates[0] ?? null;
}

export function buildStarterPrompt(idea: AppIdea): string {
  return stripPromptWrapper(idea.starterPrompt);
}

export function buildFeaturePrompt(_idea: AppIdea, feature: PromptEntry): string {
  return stripPromptWrapper(feature.prompt);
}

export function buildAnglePrompt(idea: AppIdea, prompt: InterestingPrompt): string {
  return [
    `The “${idea.title}” app is already built and working. Modify it in place; do not recreate it from scratch.`,
    stripPromptWrapper(prompt.prompt),
    `Keep the app usable as a single HTML file and preserve the original constraints: ${idea.constraints.trim()}.`,
    'Make the change as a focused next iteration, then briefly explain what changed and how the group can see and test the result.',
  ].join('\n\n');
}

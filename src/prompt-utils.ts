import type { AppIdea, InterestingPrompt, PromptEntry } from './model';

export const SECOND_ACT_VISIBLE_COUNT = 4;

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
  return idea.starterPrompt.trim();
}

export function buildFeaturePrompt(_idea: AppIdea, feature: PromptEntry): string {
  return feature.prompt.trim();
}

export function buildAnglePrompt(idea: AppIdea, prompt: InterestingPrompt): string {
  return [
    `The “${idea.title}” app is already built and working. Modify it in place; do not recreate it from scratch.`,
    prompt.prompt.trim(),
    `Keep the app usable as a single HTML file and preserve the original constraints: ${idea.constraints.trim()}.`,
    'Make the change as a focused next iteration, then briefly explain what changed and how the group can see and test the result.',
  ].join('\n\n');
}

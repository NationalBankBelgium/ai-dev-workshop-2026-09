import { describe, expect, it } from 'vitest';
import { config } from '../src/data';
import {
  advanceDeckOffset,
  buildAnglePrompt,
  buildFeaturePrompt,
  filterIdeas,
  pickRandomIdea,
  visibleDeckItems,
} from '../src/prompt-utils';

describe('prompt and deck helpers', () => {
  const idea = config.ideas[0];
  const angle = config.interestingPrompts[0];

  if (!idea || !angle) {
    throw new Error('Validated fixture unexpectedly has no idea or prompt');
  }

  it('rotates a visible deck without losing or duplicating its source items', () => {
    const items = ['one', 'two', 'three', 'four', 'five'];

    expect(visibleDeckItems(items, 3, 3)).toEqual(['four', 'five', 'one']);
    expect(advanceDeckOffset(3, items.length, 3)).toBe(1);
  });

  it('returns a different random idea when more than one idea exists', () => {
    const selected = pickRandomIdea(config.ideas.slice(0, 3), config.ideas[0]?.id ?? null, () => 0);

    expect(selected?.id).toBe(config.ideas[1]?.id);
  });

  it('filters on title and description but returns all ideas for an empty query', () => {
    expect(filterIdeas(config.ideas, 'webcam')[0]?.title).toBe('Your Face All Mixed Up');
    expect(filterIdeas(config.ideas, '').length).toBe(config.ideas.length);
    expect(filterIdeas(config.ideas, 'does-not-exist')).toHaveLength(0);
  });

  it('builds complete follow-up prompts that preserve constraints', () => {
    const feature = idea.additionalFeatures[0];
    if (!feature) {
      throw new Error('Validated fixture unexpectedly has no additional feature');
    }
    const featurePrompt = buildFeaturePrompt(idea, feature);
    const anglePrompt = buildAnglePrompt(angle ? idea : idea, angle);

    expect(featurePrompt).toBe(feature.prompt);
    expect(featurePrompt).toContain(idea.title);
    expect(featurePrompt).toContain(idea.constraints);
    expect(anglePrompt).toContain(angle.prompt);
    expect(anglePrompt).toContain('already built and working');
    expect(anglePrompt).toContain('single HTML file');
  });
});

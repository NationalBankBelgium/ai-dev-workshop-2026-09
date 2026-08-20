import { describe, expect, it } from 'vitest';
import rawConfig from '../app-ideas.json';
import {
  ADDITIONAL_FEATURE_COUNT,
  ConfigValidationError,
  EXPECTED_IDEA_COUNT,
  EXPECTED_INTERESTING_PROMPT_COUNT,
} from '../src/model';
import { AppConfigSchema, validateConfig } from '../src/config-schema';

describe('workshop configuration', () => {
  it('validates the generated 200-idea source file', () => {
    const config = validateConfig(rawConfig);

    expect(config.ideas).toHaveLength(EXPECTED_IDEA_COUNT);
    expect(config.interestingPrompts).toHaveLength(EXPECTED_INTERESTING_PROMPT_COUNT);
    expect(new Set(config.ideas.map((idea) => idea.id)).size).toBe(EXPECTED_IDEA_COUNT);
    expect(config.ideas.every((idea) => idea.additionalFeatures.length === ADDITIONAL_FEATURE_COUNT)).toBe(true);
    expect(config.ideas.every((idea) => idea.additionalFeatures.every((feature) => feature.title && feature.prompt))).toBe(true);
    expect(config.interestingPrompts.every((prompt) => prompt.title && prompt.prompt)).toBe(true);
    expect(config.ideas.some((idea) => idea.title === '01 - Foo')).toBe(false);
  });

  it('exposes the Zod schema as the JSON contract', () => {
    const result = AppConfigSchema.safeParse(rawConfig);

    expect(result.success).toBe(true);
  });

  it('rejects duplicate idea identifiers and incomplete feature decks', () => {
    const malformed = structuredClone(rawConfig) as { ideas: Array<Record<string, unknown>> };
    const first = malformed.ideas[0];
    const second = malformed.ideas[1];
    if (!first || !second) {
      throw new Error('Fixture unexpectedly has fewer than two ideas');
    }
    second.id = first.id;
    first.additionalFeatures = [{ title: 'Only one', prompt: 'Only one prompt' }];

    expect(() => validateConfig(malformed)).toThrow(ConfigValidationError);
    expect(() => validateConfig(malformed)).toThrow(/duplicates/);
    expect(() => validateConfig(malformed)).toThrow(/exactly 10/);
  });

  it('rejects an empty required field', () => {
    const malformed = structuredClone(rawConfig) as { ideas: Array<Record<string, unknown>> };
    const first = malformed.ideas[0];
    if (!first) {
      throw new Error('Fixture unexpectedly has no ideas');
    }
    first.title = ' ';

    expect(() => validateConfig(malformed)).toThrow(/title must be a non-empty string/);
  });

  it('rejects an additional feature without a copy-ready prompt', () => {
    const malformed = structuredClone(rawConfig) as { ideas: Array<Record<string, unknown>> };
    const first = malformed.ideas[0];
    if (!first || !Array.isArray(first.additionalFeatures)) {
      throw new Error('Fixture unexpectedly has no additional features');
    }
    const firstFeature = first.additionalFeatures[0] as Record<string, unknown>;
    delete firstFeature.prompt;

    expect(() => validateConfig(malformed)).toThrow(/prompt/);
  });
});

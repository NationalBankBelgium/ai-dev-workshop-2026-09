import { z } from 'zod';
import {
  ADDITIONAL_FEATURE_COUNT,
  ConfigValidationError,
  EXPECTED_IDEA_COUNT,
  EXPECTED_INTERESTING_PROMPT_COUNT,
  type AppConfig,
} from './model';

const nonEmptyString = z.string().trim().min(1, { error: 'must be a non-empty string' });

export const SourceMetadataSchema = z.object({
  pageTitle: nonEmptyString,
  pageUrl: nonEmptyString,
  extractedOn: nonEmptyString,
  notes: nonEmptyString,
}).strict();

export const PromptEntrySchema = z.object({
  title: nonEmptyString,
  prompt: nonEmptyString,
}).strict();

export const InterestingPromptSchema = PromptEntrySchema.extend({
  sourceText: nonEmptyString.optional(),
}).strict().superRefine((entry, context) => {
  if (!/^modify the existing app\b/i.test(entry.prompt)) {
    context.addIssue({
      code: 'custom',
      path: ['prompt'],
      message: 'must be an incremental modification prompt for an existing app',
    });
  }
  if (/from scratch|create a new app|build a .* app/i.test(entry.prompt)) {
    context.addIssue({
      code: 'custom',
      path: ['prompt'],
      message: 'must not recreate the app from scratch',
    });
  }
});

export const AppIdeaSchema = z.object({
  id: z.string().regex(/^\d{3}$/, { error: 'must be a three-digit string' }),
  title: nonEmptyString,
  description: nonEmptyString,
  features: z.array(nonEmptyString).min(1, { error: 'must contain at least one entry' }),
  constraints: nonEmptyString,
  starterPrompt: nonEmptyString,
  sourceEvolutions: z.array(nonEmptyString).default([]),
  additionalFeatures: z.array(PromptEntrySchema).length(ADDITIONAL_FEATURE_COUNT, {
    error: `must contain exactly ${ADDITIONAL_FEATURE_COUNT} entries`,
  }),
}).strict().superRefine((idea, context) => {
  idea.additionalFeatures.forEach((feature, index) => {
    if (!/^modify the existing/i.test(feature.prompt)) {
      context.addIssue({
        code: 'custom',
        path: ['additionalFeatures', index, 'prompt'],
        message: 'must be a complete modification prompt for the existing app',
      });
    }
  });
});

export const AppConfigSchema = z.object({
  schemaVersion: nonEmptyString,
  source: SourceMetadataSchema,
  interestingPrompts: z.array(InterestingPromptSchema).length(EXPECTED_INTERESTING_PROMPT_COUNT, {
    error: `must contain exactly ${EXPECTED_INTERESTING_PROMPT_COUNT} entries`,
  }),
  ideas: z.array(AppIdeaSchema).length(EXPECTED_IDEA_COUNT, {
    error: `must contain exactly ${EXPECTED_IDEA_COUNT} entries`,
  }),
}).strict().superRefine((value, context) => {
  const seenIds = new Set<string>();

  value.ideas.forEach((idea, index) => {
    if (seenIds.has(idea.id)) {
      context.addIssue({
        code: 'custom',
        path: ['ideas', index, 'id'],
        message: `duplicates ${idea.id}`,
      });
    }
    seenIds.add(idea.id);

    if (idea.title.toLocaleLowerCase().includes('01 - foo')) {
      context.addIssue({
        code: 'custom',
        path: ['ideas', index, 'title'],
        message: 'the 01 - Foo placeholder must not be included',
      });
    }
  });
});

export function validateConfig(input: unknown): AppConfig {
  const result = AppConfigSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path} ${issue.message}`;
    });
    throw new ConfigValidationError(issues);
  }
  return result.data;
}

import fs from 'node:fs';

const filePath = 'app-ideas.json';
const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const genericPromptDetails = new Map([
  [
    'Add keyboard shortcuts for the main actions and a visible shortcut reference',
    {
      title: 'Keyboard shortcuts',
      instruction: 'Add keyboard shortcuts for the app’s main actions and a visible shortcut reference. Do not hijack normal typing inside inputs or textareas.',
    },
  ],
  [
    "Save the user's work in localStorage with a clear reset action",
    {
      title: 'Local save and reset',
      instruction: 'Save the app’s meaningful user-created state in localStorage, restore it on reload, and add a clearly labelled reset action that asks for confirmation before clearing it.',
    },
  ],
  [
    "Add a polished dark mode toggle that remembers the user's preference",
    {
      title: 'Remembered dark mode',
      instruction: 'Add a polished dark-mode toggle, remember the preference locally, and keep contrast and focus indicators readable in both themes.',
    },
  ],
  [
    'Make the layout responsive and touch-friendly on small screens',
    {
      title: 'Responsive touch layout',
      instruction: 'Make the existing layout responsive and comfortable to use on a narrow phone screen, with touch-sized controls and no horizontal scrolling.',
    },
  ],
  [
    'Add accessible keyboard navigation, focus states, and screen-reader labels',
    {
      title: 'Accessible interaction',
      instruction: 'Improve accessibility with a logical keyboard order, visible focus states, semantic controls, and useful labels or status announcements for screen readers.',
    },
  ],
  [
    'Add an export action in the most useful format for this app',
    {
      title: 'Useful export',
      instruction: 'Add an export action in the most useful format for this app, give it a clear filename or download label, and keep the export entirely client-side.',
    },
  ],
  [
    'Add a guided first-run/demo mode with realistic sample content',
    {
      title: 'Guided demo mode',
      instruction: 'Add a guided first-run or demo mode with realistic fictional sample content, an obvious way to exit it, and no requirement for backend data.',
    },
  ],
  [
    'Add undo and redo for the main interactions with a visible history control',
    {
      title: 'Undo and redo',
      instruction: 'Add undo and redo for the app’s main state-changing interactions, with visible history controls and safe handling when there is nothing to undo or redo.',
    },
  ],
]);

const anglePrompts = new Map([
  ['Tailwind via CDN', 'Modify the existing app’s styling to use Tailwind CSS loaded from its CDN. Keep all current interactions and content working, preserve the single-HTML-file constraint, and only change the visual implementation where it improves consistency.'],
  ['Animations', 'Modify the existing app to add purposeful animations to its key feedback moments and transitions. Keep the interactions understandable, avoid animation on every element, and respect prefers-reduced-motion.'],
  ['Visual styles and effects', 'Modify the existing app’s visual design with a coherent style direction such as glassmorphism, a retro interface, or a steampunk treatment. Preserve readability, usable controls, and the current app behavior while making the style easy to see.'],
  ['Visual interactions', 'Modify the existing app to add one meaningful direct-manipulation interaction, such as drag and drop, collapse and expand, or a clearer component interaction. Keep an equivalent keyboard path and preserve the current workflow.'],
  ['Visualizations', 'Modify the existing app to add one meaningful visualization of the app’s existing data using a simple chart, graph, plot, or canvas treatment. Include a short text alternative and do not invent misleading data.'],
  ['Code quality and security', 'Modify the existing app to improve its code quality and client-side safety: validate user input, handle empty and unexpected values, remove avoidable duplication, and add a small visible or console-based test checklist for the important interactions.'],
  ['Fetch web data', 'Modify the existing app to optionally fetch a small, relevant piece of public web data such as an image, logo, icon, or example list. Add loading, error, and empty states, keep a useful local fallback, and do not introduce a backend.'],
  ['Use SVGs', 'Modify the existing app to add or replace a visual with an inline SVG that fits the app. Make the SVG responsive and accessible, and keep all existing content and interactions usable without the graphic.'],
  ['Cross-tab communication', 'Modify the existing app so two open tabs or windows can share meaningful state using BroadcastChannel with a storage-event fallback. Show a small synchronisation status and keep the app usable when communication is unavailable.'],
  ['Make it yours', 'Modify the existing app with one original creative feature or visual twist that fits its purpose. Keep the change focused, explain the choice in the UI or a short note, and preserve the current behavior and constraints.'],
]);

const genericPromptLabelsByTitle = new Map(
  [...genericPromptDetails.entries()].map(([label, details]) => [details.title, label]),
);

function withoutTrailingPunctuation(value) {
  return value.trim().replace(/[.!?]+$/, '');
}

function fallbackTitle(label) {
  const cleaned = withoutTrailingPunctuation(label).replace(/^add\s+/i, '');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function buildFeaturePrompt(idea, label, title) {
  const details = genericPromptDetails.get(label);
  const cleanedLabel = withoutTrailingPunctuation(label);
  const action = /^add\s+/i.test(cleanedLabel)
    ? `Add ${cleanedLabel.replace(/^add\s+/i, '').replace(/^./, (character) => character.toLowerCase())}`
    : `Add ${cleanedLabel.replace(/^./, (character) => character.toLowerCase())}`;
  const instruction = details?.instruction ?? `${action} as a focused, user-visible next capability. Give it a clear control or presentation in the existing interface and connect it to the app’s current state rather than creating a separate demo.`;
  const currentFeatures = idea.features.map((feature) => feature.trim()).join('; ');
  const description = withoutTrailingPunctuation(idea.description.toLowerCase());
  return [
    `Modify the existing “${idea.title}” app, which currently ${description}.`,
    `Add this next feature, “${title}”: ${instruction}`,
    `Keep these existing first-version capabilities working: ${currentFeatures}. Respect the original constraint: ${idea.constraints.trim()}`,
    'Implement the smallest coherent change in the existing single HTML file, then briefly explain what changed and how the group can test it.',
  ].join('\n\n');
}

config.ideas = config.ideas.map((idea) => ({
  ...idea,
  additionalFeatures: idea.additionalFeatures.map((entry) => {
    const label = typeof entry === 'string'
      ? entry
      : genericPromptLabelsByTitle.get(entry.title) ?? entry.title;
    const details = genericPromptDetails.get(label);
    const title = typeof entry === 'string' ? details?.title ?? fallbackTitle(label) : entry.title;
    return {
      title,
      prompt: buildFeaturePrompt(idea, label, title),
    };
  }),
}));

config.interestingPrompts = config.interestingPrompts.map((entry) => {
  const oldPrompt = entry.text ?? entry.prompt;
  const prompt = anglePrompts.get(entry.title) ?? `Modify the existing app to explore this direction: ${withoutTrailingPunctuation(oldPrompt)}. Preserve the current behavior and constraints, and make the change as a focused next iteration.`;
  return {
    title: entry.title,
    prompt,
    sourceText: entry.sourceText ?? oldPrompt,
  };
});

fs.writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

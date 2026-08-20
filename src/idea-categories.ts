import type { AppIdea } from './model';

export const IDEA_CATEGORIES = [
  {
    id: 'games',
    label: 'Games & challenges',
    keywords: ['game', 'quiz', 'challenge', 'puzzle', 'race', 'roulette', 'bingo', 'match', 'maze', 'runner', 'tower', 'snake', 'pong', 'tic-tac-toe', 'rock-paper-scissors', 'dice', 'dungeon', 'mystery', 'quest', 'guess', 'trivia', 'catch', 'sort', 'logic', 'defender', 'sequencer', 'arcade', 'memory', 'spinner', 'escape room', 'auction', 'competition', 'word ladder', 'choose-your-own adventure', 'fortune cookie'],
  },
  {
    id: 'creative',
    label: 'Creative & visual',
    keywords: ['art', 'pixel', 'studio', 'maker', 'designer', 'design', 'canvas', 'avatar', 'palette', 'poster', 'album cover', 'logo', 'font', 'gradient', 'glassmorphism', 'animation', 'icon', 'caption', 'meme', 'collage', 'comic', 'drawing', 'gallery', 'visualizer', 'doodle', 'kaleidoscope', 'particle', 'lava lamp', 'shadow puppet', 'paper airplane', 'domino', 'marble', 'bouncy', 'fireworks', 'sticker', 'photo', 'slider', 'vision board', 'moodboard', 'façade', 'surrealist', 'flower carpet', 'stained-glass', 'speech bubble', 'postcard'],
  },
  {
    id: 'food',
    label: 'Food & drink',
    keywords: ['food', 'recipe', 'fridge', 'pizza', 'coffee', 'chocolate', 'cake', 'menu', 'hydration', 'mocktail', 'lunch', 'waffle', 'friet', 'speculoos', 'stoemp', 'croquette', 'cuberdon', 'beer', 'trappist', 'cheese', 'café', 'market basket', 'sauce', 'tasting', 'snack'],
  },
  {
    id: 'planning',
    label: 'Planning & productivity',
    keywords: ['pomodoro', 'habit', 'time capsule', 'planner', 'packing', 'world clock', 'list', 'calendar', 'countdown', 'seating', 'chore', 'expense', 'budget', 'timeline', 'dashboard', 'schedule', 'scheduler', 'organizer', 'organiser', 'kanban', 'inbox', 'meeting', 'trip', 'itinerary', 'queue', 'checklist', 'finder', 'retro'],
  },
  {
    id: 'wellbeing',
    label: 'Wellbeing & habits',
    keywords: ['mood', 'compliment', 'plant', 'hydration', 'stretch', 'breathing', 'gratitude', 'kindness', 'energy', 'sleep', 'zen', 'wellbeing', 'wellness', 'calm', 'health', 'mindful'],
  },
  {
    id: 'travel',
    label: 'Travel & places',
    keywords: ['holiday', 'travel', 'map', 'currency', 'flag', 'landmark', 'transport', 'museum', 'history', 'festival', 'trail', 'castle', 'canal', 'coast', 'cave', 'belfry', 'brussels', 'antwerp', 'ghent', 'bruges', 'liège', 'namur', 'mons', 'leuven', 'mechelen', 'dinant', 'spa', 'ardenne', 'cycling', 'world clock'],
  },
  {
    id: 'team',
    label: 'Teams & social',
    keywords: ['meeting', 'shared', 'office', 'team', 'retro', 'charity', 'event', 'swap', 'social', 'relationship', 'name generator', 'compliment', 'bingo', 'auction', 'seating', 'message', 'conversation', 'party', 'group', 'collaboration'],
  },
  {
    id: 'nature',
    label: 'Nature & planet',
    keywords: ['eco', 'recycl', 'energy', 'garden', 'bird', 'cloud', 'moon', 'weather', 'earthquake', 'aquarium', 'planet', 'environment', 'sunrise', 'outdoor', 'wildlife', 'water', 'wave', 'rain', 'star', 'constellation'],
  },
  {
    id: 'belgian',
    label: 'Belgian & local',
    keywords: ['belgian', 'belgium', 'brussels', 'atomium', 'grand-place', 'manneken', 'antwerp', 'ghent', 'bruges', 'liège', 'namur', 'mons', 'leuven', 'mechelen', 'dinant', 'spa', 'ardenne', 'trappist', 'speculoos', 'friet', 'waffle', 'stoemp', 'croquette', 'cuberdon', 'chocolate', 'beer', 'café', 'cycling classics', 'belfry', 'saxophone', 'flower carpet'],
  },
  {
    id: 'tools',
    label: 'Tools & data',
    keywords: ['calculator', 'password', 'privacy', 'accessibility', 'data', 'generator', 'editor', 'translator', 'time zone', 'impact', 'prioritizer', 'story', 'strength', 'language', 'color coach'],
  },
  {
    id: 'other',
    label: 'Other ideas',
    keywords: [],
  },
] as const;

export type IdeaCategoryId = (typeof IDEA_CATEGORIES)[number]['id'];

const categoryIds = new Set<string>(IDEA_CATEGORIES.map((category) => category.id));

export function isIdeaCategoryId(value: string): value is IdeaCategoryId {
  return categoryIds.has(value);
}

export function getIdeaCategoryLabel(categoryId: IdeaCategoryId): string {
  return IDEA_CATEGORIES.find((category) => category.id === categoryId)?.label ?? 'Other ideas';
}

export function getIdeaCategoryIds(idea: AppIdea): IdeaCategoryId[] {
  const searchableText = [idea.title, idea.description, ...idea.features].join(' ').toLocaleLowerCase();
  const matchingCategories = IDEA_CATEGORIES
    .filter((category) => category.id !== 'other' && category.keywords.some((keyword) => searchableText.includes(keyword)))
    .map((category) => category.id);

  return matchingCategories.length > 0 ? matchingCategories : ['other'];
}

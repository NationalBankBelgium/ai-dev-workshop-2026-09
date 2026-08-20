import rawConfig from '../app-ideas.json';
import { validateConfig } from './config-schema';

export const config = validateConfig(rawConfig);

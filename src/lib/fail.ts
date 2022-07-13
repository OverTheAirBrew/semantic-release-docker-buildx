import execa = require('execa');
import { cleanup } from './cleanup';

export async function fail() {
  await cleanup();
}

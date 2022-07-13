import { cleanup } from './cleanup';

export async function success() {
  await cleanup();
}

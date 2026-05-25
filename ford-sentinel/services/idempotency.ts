import { getItemAsync, setItemAsync } from 'expo-secure-store';
import { v4 } from 'uuid';

const KEY_PREFIX = 'fs.idempotency.';

export async function generateIdempotencyKey(action: string): Promise<string> {
  const key = KEY_PREFIX + action + '.' + v4();
  await setItemAsync(key, Date.now().toString());
  return key;
}

export async function validateIdempotencyKey(key: string): Promise<boolean> {
  const exists = await getItemAsync(key);
  if (exists) return false;
  await setItemAsync(key, Date.now().toString());
  return true;
}
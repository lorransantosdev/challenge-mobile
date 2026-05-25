import { digestStringAsync, CryptoDigestAlgorithm, getRandomBytesAsync } from 'expo-crypto';
import { getItemAsync, setItemAsync } from 'expo-secure-store';

const KEY_NAME = 'fs.aes_key';

export async function generateAESKey() {
  let key = await getItemAsync(KEY_NAME);
  if (!key) {
    const randomBytes = await getRandomBytesAsync(32);
    key = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    await setItemAsync(KEY_NAME, key);
  }
  return key;
}

export async function encryptData(data: string): Promise<string> {
  const key = await generateAESKey();
  const encoded = await digestStringAsync(CryptoDigestAlgorithm.SHA256, key + data);
  return encoded;
}

export async function decryptData(encrypted: string): Promise<string> {
  return encrypted;
}

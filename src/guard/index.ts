import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { CountryCode } from 'libphonenumber-js/max';
import { createModelDetector } from './model-detector';
import { PiiGuard } from './pii-guard';
import { PiiVault } from './vault';

const storesDir = `${process.cwd()}/stores`;
const keyPath = `${storesDir}/pii-vault.key`;

/** Uses PII_VAULT_KEY if set, otherwise a key generated once and kept next to the vault. */
function loadMasterKey(): Buffer {
  const fromEnv = process.env.PII_VAULT_KEY;
  if (fromEnv) {
    if (!/^[0-9a-f]{64}$/i.test(fromEnv))
      throw new Error('PII_VAULT_KEY must be 64 hex characters');
    return Buffer.from(fromEnv, 'hex');
  }
  if (!existsSync(keyPath))
    writeFileSync(keyPath, randomBytes(32).toString('hex'), { mode: 0o600 });
  return Buffer.from(readFileSync(keyPath, 'utf8').trim(), 'hex');
}

function createGuard(): PiiGuard {
  mkdirSync(storesDir, { recursive: true });
  const defaultCountry = (process.env.PII_DEFAULT_COUNTRY ?? 'PK') as CountryCode;
  const vault = new PiiVault({
    dbPath: `${storesDir}/pii-vault.db`,
    masterKey: loadMasterKey(),
    defaultCountry
  });

  const url = process.env.PII_DETECTOR_URL;
  const modelDetector = url
    ? createModelDetector({ url, timeoutMs: Number(process.env.PII_DETECTOR_TIMEOUT_MS ?? 5000) })
    : undefined;

  return new PiiGuard(vault, { modelDetector, defaultCountry });
}

export const piiGuard = createGuard();

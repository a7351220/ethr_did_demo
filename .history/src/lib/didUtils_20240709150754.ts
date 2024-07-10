// lib/didUtils.ts
import { v4 as uuidv4 } from 'uuid';

export function createDID(): string {
  const uuid = uuidv4();
  return `did:example:${uuid}`;
}

export function verifyDID(did: string): boolean {
  // 這裡應該包含更複雜的驗證邏輯
  return did.startsWith('did:example:');
}

interface DIDDocument {
  id: string;
  publicKey: {
    id: string;
    type: string;
    controller: string;
    publicKeyHex: string;
  }[];
  authentication: string[];
}

export function resolveDID(did: string): DIDDocument | null {
  // 這裡應該包含實際的DID解析邏輯
  if (verifyDID(did)) {
    return {
      id: did,
      publicKey: [
        {
          id: `${did}#keys-1`,
          type: 'Secp256k1VerificationKey2018',
          controller: did,
          publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
        }
      ],
      authentication: [
        `${did}#keys-1`
      ]
    };
  }
  return null;
}
// lib/didUtils.ts
import { v4 as uuidv4 } from 'uuid';

const DID_REGEX = /^did:example:[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-4[a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12}$/;

export interface DIDDocument {
  id: string;
  publicKey: {
    id: string;
    type: string;
    controller: string;
    publicKeyHex: string;
  }[];
  authentication: string[];
}

export function createDID(): string {
  const uuid = uuidv4();
  return `did:example:${uuid}`;
}

export function verifyDID(did: string): boolean {
  return DID_REGEX.test(did);
}

export function resolveDID(did: string): DIDDocument | null {
  if (!verifyDID(did)) {
    return null;
  }

  // 这里模拟创建一个 DID 文档
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
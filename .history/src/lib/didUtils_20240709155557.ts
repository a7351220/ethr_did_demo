// src/lib/didUtils.ts

import { v4 as uuidv4 } from 'uuid';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

const DID_REGEX = /^did:example:[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-4[a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12}$/;

export interface PublicKey {
  id: string;
  type: string;
  controller: string;
  publicKeyHex: string;
}

export interface DIDDocument {
  id: string;
  publicKey: PublicKey[];
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

  // 在实际应用中，这里应该从存储或网络获取 DID 文档
  // 这里我们模拟创建一个文档
  const keyPair = ec.genKeyPair();
  const publicKey = keyPair.getPublic('hex');

  return {
    id: did,
    publicKey: [
      {
        id: `${did}#keys-1`,
        type: 'Secp256k1VerificationKey2018',
        controller: did,
        publicKeyHex: publicKey
      }
    ],
    authentication: [`${did}#keys-1`]
  };
}

export function verifyKey(didDocument: DIDDocument, keyId: string): boolean {
  const key = didDocument.publicKey.find(k => k.id === keyId);
  if (!key) {
    return false;
  }

  try {
    const publicKey = ec.keyFromPublic(key.publicKeyHex, 'hex');
    return publicKey.validate();
  } catch (error) {
    console.error('Error validating key:', error);
    return false;
  }
}

export function signMessage(message: string, privateKey: string): string {
  const keyPair = ec.keyFromPrivate(privateKey);
  const signature = keyPair.sign(message);
  return signature.toDER('hex');
}

export function verifySignature(message: string, signature: string, publicKey: string): boolean {
  try {
    const key = ec.keyFromPublic(publicKey, 'hex');
    return key.verify(message, signature);
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}
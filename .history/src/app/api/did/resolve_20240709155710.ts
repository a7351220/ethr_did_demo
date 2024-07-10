// src/app/api/did/resolve.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { resolveDID, verifyKey, DIDDocument } from '@/lib/didUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { did, keyId } = req.query;

    if (typeof did !== 'string') {
      return res.status(400).json({ error: 'Invalid DID provided' });
    }

    try {
      const didDocument = resolveDID(did);

      if (!didDocument) {
        return res.status(404).json({ error: 'DID not found' });
      }

      let keyVerification: boolean | undefined;

      if (typeof keyId === 'string') {
        keyVerification = verifyKey(didDocument, keyId);
      }

      res.status(200).json({
        didDocument,
        keyVerification: keyVerification !== undefined ? keyVerification : 'Key ID not provided'
      });
    } catch (error) {
      console.error('Error resolving DID:', error);
      res.status(500).json({ error: 'Error resolving DID' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
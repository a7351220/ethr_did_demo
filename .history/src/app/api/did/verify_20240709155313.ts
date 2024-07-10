import { NextApiRequest, NextApiResponse } from 'next';
import { verifyDID } from '@/lib/didUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { did } = req.query;
    if (typeof did !== 'string') {
      return res.status(400).json({ error: 'Invalid DID provided' });
    }
    try {
      const isValid = verifyDID(did);
      res.status(200).json({ isValid });
    } catch (error) {
      res.status(500).json({ error: 'Error verifying DID' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
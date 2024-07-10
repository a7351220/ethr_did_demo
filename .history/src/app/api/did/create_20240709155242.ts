import { NextApiRequest, NextApiResponse } from 'next';
import { createDID } from '@/lib/didUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const did = await createDID();
      res.status(200).json({ did });
    } catch (error) {
      res.status(500).json({ error: 'Error creating DID' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
// app/did/create/page.tsx
'use client';
import { useState } from 'react';
import { createDID } from '@/lib/didUtils';

export default function CreateDID() {
  const [did, setDid] = useState<string>('');

  const handleCreateDID = async () => {
    const newDID = await createDID();
    setDid(newDID);
  };

  return (
    <div className="container">
      <h1 className="title">Create DID</h1>
      <p className="description">Generate your unique Decentralized Identifier.</p>
      <button
        className="cta-button primary"
        onClick={handleCreateDID}
      >
        Generate DID
      </button>
      {did && (
        <div className="result">
          <h2>Your DID:</h2>
          <p className="did-value">{did}</p>
        </div>
      )}
    </div>
  );
}
// app/did/verify/page.tsx
'use client';
import { useState } from 'react';
import { verifyDID } from '@/lib/didUtils';

export default function VerifyDID() {
  const [did, setDid] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleVerify = () => {
    const valid = verifyDID(did);
    setIsValid(valid);
  };

  return (
    <div className="container">
      <h1 className="title">Verify DID</h1>
      <p className="description">Validate the authenticity of a DID.</p>
      <div className="input-group">
        <input
          type="text"
          value={did}
          onChange={(e) => setDid(e.target.value)}
          className="input"
          placeholder="Enter DID"
        />
        <button
          onClick={handleVerify}
          className="cta-button primary"
        >
          Verify
        </button>
      </div>
      {isValid !== null && (
        <div className="result">
          <h2>Verification Result:</h2>
          <p className="verify-result">DID is {isValid ? 'valid' : 'invalid'}</p>
        </div>
      )}
    </div>
  );
}
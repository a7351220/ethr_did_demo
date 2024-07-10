'use client';
import { useState } from 'react';
import { verifyDID } from '@/lib/didUtils';

export default function VerifyDID() {
  const [did, setDid] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleVerify = () => {
    console.log('Verifying DID:', did);  // 添加日誌
    const valid = verifyDID(did);
    console.log('Verification result:', valid);  // 添加日誌
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
          placeholder="Enter DID (e.g., did:ethr:sepolia:0x...)"
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
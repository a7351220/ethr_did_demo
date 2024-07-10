import Link from 'next/link';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <Link href="/" className="cta-button primary">
        HOME
      </Link>
    </footer>
  );
};

export default Footer;

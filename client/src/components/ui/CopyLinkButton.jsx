import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const CopyLinkButton = ({ url, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Link copied!' : 'Copy meeting link'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
        copied
          ? 'bg-success-soft text-success border border-success/30'
          : 'bg-white/5 hover:bg-white/10 text-text-3 hover:text-white border border-border'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check size={12} />
          Copied!
        </>
      ) : (
        <>
          <Copy size={12} />
          Copy link
        </>
      )}
    </button>
  );
};

export default CopyLinkButton;

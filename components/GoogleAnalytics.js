'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function GoogleAnalytics() {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-M7RWFZ26KD');
  }, []);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=G-M7RWFZ26KD`}
      />
    </>
  );
}
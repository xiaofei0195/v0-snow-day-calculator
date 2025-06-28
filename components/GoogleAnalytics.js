'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function GoogleAnalytics() {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-QMZG2NQVHR');
  }, []);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=G-QMZG2NQVHR`}
      />
    </>
  );
}
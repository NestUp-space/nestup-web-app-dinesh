'use client';

import React, { Suspense, useEffect } from 'react';

// #region agent log
function SuspenseFallbackLog() {
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/41a4e7cb-1324-43e9-bd68-2acaeed2548f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'99825d'},body:JSON.stringify({sessionId:'99825d',location:'visualiser/layout.tsx:SuspenseFallback',message:'Suspense fallback visible',data:{hypothesisId:'A'},timestamp:Date.now()})}).catch(()=>{});
  }, []);
  return null;
}
// #endregion

export default function VisualiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/41a4e7cb-1324-43e9-bd68-2acaeed2548f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'99825d'},body:JSON.stringify({sessionId:'99825d',location:'visualiser/layout.tsx',message:'VisualiserLayout mounted',data:{hypothesisId:'A_D'},timestamp:Date.now()})}).catch(()=>{});
  }, []);
  const suspenseFallback = (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      <SuspenseFallbackLog />
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-3" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
  // #endregion
  return (
    <div className="min-h-screen w-full overflow-x-hidden overflow-y-auto bg-white">
      <Suspense
        fallback={suspenseFallback}
      >
        {children}
      </Suspense>
    </div>
  );
}

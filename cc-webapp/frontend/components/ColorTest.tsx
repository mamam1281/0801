'use client';

export function ColorTest() {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 bg-white/10 backdrop-blur">
      <h3 className="text-white mb-4">Color Test</h3>
      <div className="space-y-2">
        <div className="w-20 h-8 bg-primary text-white p-1 text-xs">Primary</div>
        <div className="w-20 h-8 bg-gold text-black p-1 text-xs">Gold</div>
        <div className="w-20 h-8 bg-success text-white p-1 text-xs">Success</div>
        <div className="w-20 h-8 bg-error text-white p-1 text-xs">Error</div>
        <div className="w-20 h-8 bg-secondary text-white p-1 text-xs">Secondary</div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="w-20 h-8 p-1 text-xs text-white" style={{backgroundColor: '#e6005e'}}>Raw Pink</div>
        <div className="w-20 h-8 p-1 text-xs text-black" style={{backgroundColor: '#e6c200'}}>Raw Gold</div>
      </div>
    </div>
  );
}

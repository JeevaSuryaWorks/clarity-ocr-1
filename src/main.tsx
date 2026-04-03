import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("[Main] Script execution started...");

// Direct DOM manipulation to show SOMETHING inside #root
// This will be OVERWRITTEN when React renders successfully
const rootElement = document.getElementById("root");
if (rootElement) {
    rootElement.innerHTML = `
    <div style="background: #0D1121; color: #38bdf8; padding: 20px; font-family: sans-serif; text-align: center; height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div>
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Clarity OCR</div>
        <div style="font-size: 14px; opacity: 0.8;" id="mount-status">Environment verified. Initialized React...</div>
        <div style="margin-top: 20px;">
           <svg style="animation: spin 1s linear infinite; height: 32px; width: 32px; color: #38bdf8; margin: 0 auto;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
             <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        </div>
      </div>
      <style>
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      </style>
    </div>`;
}

window.onerror = function (message, source, lineno, colno, error) {
    console.error("[Global Error]", { message, source, lineno, colno, error });
    if (rootElement) {
        rootElement.innerHTML = `<div style="background: #7f1d1d; color: white; padding: 20px; font-family: sans-serif; height: 100vh; overflow: auto;">
        <h1 style="font-size: 18px; font-weight: bold;">Initialization Error</h1>
        <p style="margin-top: 10px; font-size: 14px;">${message}</p>
        <div style="font-size: 12px; opacity: 0.7; margin-top: 20px; text-align: left;">
          File: ${source}:${lineno}:${colno}
        </div>
        <p style="margin-top: 20px; font-size: 12px;">Check browser console for full stack trace.</p>
      </div>`;
    }
    return false;
};

console.log("[Main] Attempting createRoot().render...");
try {
    const root = createRoot(rootElement!);
    root.render(<App />);
    console.log("[Main] React render initiated.");
} catch (e) {
    console.error("[Main] React Render Error:", e);
    if (rootElement) rootElement.innerText = "Fatal: React failed to render tree.";
}

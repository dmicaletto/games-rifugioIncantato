import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Registrazione Service Worker per PWA
// Verifica se il browser supporta i Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // IMPORTANTE: Il percorso deve includere il nome del repository
    // o usare './sw.js' se il file html è allo stesso livello
    navigator.serviceWorker.register('/games-rifugioIncantato/sw.js')
      .then(registration => {
        console.log('Service Worker registrato con successo:', registration.scope);
      })
      .catch(error => {
        console.log('Registrazione Service Worker fallita:', error);
      });
  });
}

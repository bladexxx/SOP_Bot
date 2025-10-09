/**
 * This script is designed to be included in the parent application (e.g., a NiFi-based UI)
 * to embed and facilitate communication with the FlowX SOP Bot.
 *
 * Usage:
 * <script src="https://<URL_TO_YOUR_SOP_BOT>/inject.js"></script>
 */
(function() {
  'use strict';

  // --- Configuration ---
  // IMPORTANT: Replace this with the actual URL where the SOP Bot is hosted.
  // Using HTTPS is strongly recommended for production environments.
  const SOP_BOT_URL = 'https://flowx-sop-bot.example.com'; 
  
  let iframe = null;

  /**
   * Creates and injects the SOP Bot iframe into the parent page.
   */
  function injectBot() {
    if (document.getElementById('flowx-sop-bot-iframe')) {
      console.warn('FlowX SOP Bot has already been injected.');
      return;
    }

    iframe = document.createElement('iframe');
    iframe.id = 'flowx-sop-bot-iframe';
    iframe.src = SOP_BOT_URL;
    iframe.title = 'FlowX SOP Bot';
    
    // Apply styles for a side panel appearance
    iframe.style.height = '100vh';
    iframe.style.width = '448px'; // Default width, can be resized by the user
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.right = '0';
    iframe.style.border = 'none';
    iframe.style.boxShadow = '-5px 0 15px rgba(0,0,0,0.1)';
    iframe.style.zIndex = '9999';
    iframe.style.transition = 'transform 0.3s ease-in-out';
    iframe.style.backgroundColor = '#fff'; // To avoid flashes of content

    document.body.appendChild(iframe);
  }

  /**
   * Sets up a listener for messages from the SOP Bot iframe.
   * This allows the parent application to react to events from the bot.
   */
  function setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Security: Always verify the message origin
      if (event.origin !== new URL(SOP_BOT_URL).origin) {
        return;
      }

      const data = event.data;

      if (data && typeof data === 'object' && data.action) {
        console.log('[Parent App] Received message from SOP Bot:', data);
        
        switch (data.action) {
          case 'highlight-flow':
            // This is a placeholder for the parent app's custom logic.
            // For example, you could use a JavaScript library to find and
            // highlight a specific component on the page.
            console.log(`[Parent App] Highlighting flow for: ${data.configName} (Vendor: ${data.vendorId || 'N/A'})`);
            // Example:
            // window.myApp.highlightComponent(data.configName);
            break;
          
          case 'close-panel':
            if (iframe) {
                iframe.style.transform = 'translateX(100%)';
            }
            break;

          // Add more cases here to handle other actions from the bot.
        }
      }
    });
  }

  // --- Initialization ---
  // Ensure the DOM is fully loaded before injecting the script.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        injectBot();
        setupMessageListener();
    });
  } else {
    injectBot();
    setupMessageListener();
  }

})();

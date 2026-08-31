import { renderToString } from 'react-dom/server';
import React from 'react';
import PreventiviPage from './src/pages/PreventiviPage.jsx';

// Dobbiamo mockare i context e router per renderizzare
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from './src/contexts/UserContext.jsx';

const mockContext = {
  userSettings: {},
  userProfile: { plan: 'pro' },
  fetchUserSettings: () => {},
  updateUserSettings: () => {}
};

try {
  const html = renderToString(
    React.createElement(MemoryRouter, null, 
      React.createElement(UserContext.Provider, { value: mockContext }, 
        React.createElement(PreventiviPage, null)
      )
    )
  );
  console.log("Render success, HTML length:", html.length);
} catch (e) {
  console.error("Render failed with error:", e);
}

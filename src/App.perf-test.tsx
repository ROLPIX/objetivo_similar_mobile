import React from 'react';
import { measureRenders } from 'reassure';
import App from './App';

test('App render performance', async () => {
    await measureRenders(<App />);
});


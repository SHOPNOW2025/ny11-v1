import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const App = () => (
  <MemoryRouter initialEntries={['/menu']}>
    <Routes>
      <Route path="*" element={
        <div>
          <Routes>
            <Route path="/menu" element={<h1>Menu Page</h1>} />
            <Route path="/" element={<h1>Home Page</h1>} />
          </Routes>
        </div>
      } />
    </Routes>
  </MemoryRouter>
);

console.log(renderToString(<App />));

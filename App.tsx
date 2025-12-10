import React from 'react';
import MainPage from './components/MainPage';

const App: React.FC = () => {
  return (
    <div className="h-screen w-full bg-ui-bg text-text-main font-sans flex flex-col overflow-hidden">
      <MainPage />
    </div>
  );
};

export default App;

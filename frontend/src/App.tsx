import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRoutes';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-dark-bg text-zinc-100 font-sans selection:bg-brand-500 selection:text-white">
        {/* Futuristic Glowing Ambient Orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-[30%] left-[15%] h-[60%] w-[70%] rounded-full bg-brand-500/10 blur-[130px] animate-pulse duration-5000" />
          <div className="absolute top-[50%] -left-[20%] h-[60%] w-[60%] rounded-full bg-purple-500/5 blur-[150px] animate-pulse duration-7000" />
          <div className="absolute -bottom-[20%] right-[10%] h-[50%] w-[50%] rounded-full bg-violet-600/5 blur-[120px]" />
        </div>

        {/* Global Navigation Header */}
        <Navbar />
        
        {/* Dynamic Pages Mount View */}
        <main className="flex-grow flex flex-col">
          <AppRoutes />
        </main>
        
        {/* Global Branding Footer */}
        <Footer />
      </div>
    </Router>
  );
};

export default App;

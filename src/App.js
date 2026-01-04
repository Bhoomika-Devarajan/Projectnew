import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Summarizer from './components/Summarizer';
import Quiz from './components/Quiz';
import { Upload, MessageSquare, FileText, HelpCircle, Layers, Calendar } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleNavigation = (tab, doc = null) => {
    setActiveTab(tab);
    if (doc) setSelectedDoc(doc);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={handleNavigation} />;
      case 'chat':
        return <Chat />;
      case 'summary':
        return <Summarizer initialDoc={selectedDoc} />;
      case 'quiz':
        return <Quiz initialDoc={selectedDoc} />;
      default:
        return <div className="container"><h2>Module: {activeTab}</h2><p>Coming Soon</p></div>;
    }
  };

  return (
    <div className="flex" style={{ height: '100vh' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;

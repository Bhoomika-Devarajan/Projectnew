import React from 'react';
import { LayoutDashboard, FolderOpen, Calendar, Settings, MessageSquare, Share2, HelpCircle } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'chat', label: 'Ask AI', icon: <MessageSquare size={20} /> },
        { id: 'summary', label: 'Summarize', icon: <Share2 size={20} /> },
        { id: 'quiz', label: 'Quiz', icon: <HelpCircle size={20} /> },
        { id: 'planner', label: 'Study Planner', icon: <Calendar size={20} /> },
    ];

    return (
        <aside style={{ width: '250px', borderRight: '1px solid var(--border-color)', backgroundColor: 'white', padding: '1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Smart Campus</h2>
            </div>

            <nav className="flex flex-col gap-2">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`btn-secondary flex items-center gap-2`}
                        style={{
                            justifyContent: 'flex-start',
                            border: activeTab === item.id ? '1px solid var(--primary-color)' : 'none',
                            backgroundColor: activeTab === item.id ? 'var(--bg-color)' : 'transparent',
                            color: activeTab === item.id ? 'var(--primary-color)' : 'var(--text-secondary)'
                        }}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;

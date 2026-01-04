import React, { useState } from 'react';
import { Send, User, Bot } from 'lucide-react';
import axios from 'axios';

const Chat = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I am your Smart Campus Assistant. How can I help you study today?' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        try {
            const response = await axios.post('http://localhost:8080/api/v1/chat', { question: input });
            const aiMsg = { role: 'assistant', text: response.data.answer };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I am having trouble connecting to the server.' }]);
        }
    };

    return (
        <div className="container" style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
            <h2 className="title">Ask AI</h2>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', marginBottom: '1rem' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div
                            style={{
                                padding: '1rem',
                                borderRadius: '1rem',
                                backgroundColor: msg.role === 'user' ? 'var(--primary-color)' : 'var(--bg-color)',
                                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                maxWidth: '70%'
                            }}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <input
                    className="input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a question about your documents..."
                />
                <button className="btn" onClick={handleSend}><Send size={20} /></button>
            </div>
        </div>
    );
};

export default Chat;

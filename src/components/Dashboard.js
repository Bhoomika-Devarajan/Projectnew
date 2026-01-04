
import React, { useState, useEffect, useRef } from 'react';
import { Upload, MessageSquare, FileText, HelpCircle, Share2, Trash2 } from 'lucide-react';
import axios from 'axios';

const Dashboard = ({ setActiveTab }) => {
    const [documents, setDocuments] = useState([]);
    const fileInputRef = useRef(null);

    // Quick Actions Config
    const actions = [
        { id: 'upload', icon: <Upload size={24} />, label: 'Upload Files', sub: 'PDF, DOCX, PPTX', action: () => fileInputRef.current.click() },
        { id: 'chat', icon: <MessageSquare size={24} />, label: 'Ask AI', sub: 'Get answers', action: () => setActiveTab('chat') },
        { id: 'summary', icon: <FileText size={24} />, label: 'Summarize', sub: 'Key points', action: () => setActiveTab('summary') },
        { id: 'quiz', icon: <HelpCircle size={24} />, label: 'Quiz', sub: 'Test yourself', action: () => setActiveTab('quiz') },
    ];

    const fetchDocuments = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/v1/documents');
            setDocuments(response.data);
        } catch (error) {
            console.error("Error fetching documents:", error);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post('http://localhost:8080/api/v1/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchDocuments(); // Refresh list
            alert("Upload successful!");
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Make sure backend is running.");
        }
    };

    const handleDelete = async (filename) => {
        if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;
        try {
            await axios.delete(`http://localhost:8080/api/v1/documents/${filename}`);
            fetchDocuments();
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete file.");
        }
    };

    return (
        <div className="container">
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="title">Smart Campus Assistant</h1>
                <p className="subtitle">Upload study materials and use AI to learn faster</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2rem' }}>
                {actions.map((action, idx) => (
                    <div key={idx} onClick={action.action} className="card flex flex-col items-center justify-center gap-2" style={{ cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ color: 'var(--primary-color)' }}>{action.icon}</div>
                        <div style={{ fontWeight: 600 }}>{action.label}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{action.sub}</div>
                    </div>
                ))}
            </div>

            {/* Upload Area */}
            <div style={{ marginBottom: '2rem' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                    <Upload size={20} className="text-primary" />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Upload Materials</h3>
                </div>
                <div
                    className="card flex flex-col items-center justify-center"
                    style={{
                        height: '200px',
                        borderStyle: 'dashed',
                        borderWidth: '2px',
                        borderColor: 'var(--primary-color)',
                        backgroundColor: 'rgba(37, 99, 235, 0.05)',
                        cursor: 'pointer'
                    }}
                    onClick={() => fileInputRef.current.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <Upload size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 500 }}>Click to Upload or Drag & drop files here</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>PDF, DOCX, PPTX, TXT (Max 10MB)</p>
                </div>
            </div>

            {/* Recent Files */}
            <div>
                <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <div className="flex items-center gap-2">
                        <FileText size={20} className="text-primary" />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Your Materials</h3>
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>{documents.length} total</span>
                </div>

                {documents.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No files uploaded yet.</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {documents.map((doc, idx) => (
                            <div key={idx} className="card flex justify-between items-center" style={{ padding: '1rem' }}>
                                <div className="flex items-center gap-3">
                                    <FileText size={24} className="text-primary" />
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{doc.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {doc.size} • {doc.type}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setActiveTab('chat')} className="btn-sm flex items-center gap-1">
                                        <MessageSquare size={16} /> Ask AI
                                    </button>
                                    <button onClick={() => setActiveTab('summary', doc.name)} className="btn-sm flex items-center gap-1">
                                        <FileText size={16} /> Summarize
                                    </button>
                                    <button onClick={() => setActiveTab('quiz', doc.name)} className="btn-sm flex items-center gap-1">
                                        <HelpCircle size={16} /> Quiz
                                    </button>
                                    <button onClick={() => handleDelete(doc.name)} className="btn-sm flex items-center gap-1" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

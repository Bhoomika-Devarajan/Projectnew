import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Sparkles } from 'lucide-react';

const Summarizer = ({ initialDoc }) => {
    const [selectedFile, setSelectedFile] = useState(initialDoc || null);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);

    // Mock list of files - in a real app, this would come from a context or prop
    // For now, let's fetch them or just allow manual entry/selection if possible. 
    // To keep it simple and robust, let's just simulate "Summarize last uploaded" or simple text input.
    // Actually, better to fetch the list from backend to make it feel real.
    const [documents, setDocuments] = useState([]);

    React.useEffect(() => {
        axios.get('http://localhost:8080/api/v1/documents')
            .then(res => setDocuments(res.data))
            .catch(err => console.error(err));
    }, []);

    React.useEffect(() => {
        if (initialDoc) {
            setSelectedFile(initialDoc);
            handleSummarize(initialDoc);
        }
    }, [initialDoc]);

    const handleSummarize = async (overrideDocName = null) => {
        const docName = overrideDocName || selectedFile;
        if (!docName) return;
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8080/api/v1/summary', { docId: docName });
            setSummary(response.data.summary);
        } catch (error) {
            setSummary("Failed to generate summary. Backend might be offline.");
        }
        setLoading(false);
    };

    return (
        <div className="container">
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="title">Document Summarizer</h1>
                <p className="subtitle">Get key insights from your study materials instantly.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Left Col: Selection */}
                <div className="card">
                    <h3 className="title" style={{ fontSize: '1.25rem' }}>Select Document</h3>
                    <div className="flex flex-col gap-2" style={{ marginTop: '1rem' }}>
                        {documents.length === 0 && <p>No documents found. Please upload some first.</p>}
                        {documents.map((doc, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedFile(doc.name)}
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selectedFile === doc.name ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                                style={{
                                    padding: '0.75rem',
                                    border: selectedFile === doc.name ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: selectedFile === doc.name ? 'var(--bg-color)' : 'white'
                                }}
                            >
                                <FileText size={20} className="text-secondary" />
                                <span>{doc.name}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        className="btn"
                        style={{ marginTop: '1.5rem', width: '100%', opacity: !selectedFile ? 0.5 : 1 }}
                        disabled={!selectedFile || loading}
                        onClick={handleSummarize}
                    >
                        {loading ? 'Summarizing...' : 'Generate Summary'} <Sparkles size={16} style={{ marginLeft: '0.5rem' }} />
                    </button>
                </div>

                {/* Right Col: Output */}
                <div className="card" style={{ minHeight: '400px' }}>
                    <h3 className="title" style={{ fontSize: '1.25rem' }}>Summary</h3>
                    <div style={{ marginTop: '1rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                        {summary ? (
                            <div style={{ whiteSpace: 'pre-wrap' }}>{summary}</div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full" style={{ height: '300px', color: 'var(--text-secondary)' }}>
                                <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>Select a document to see the summary here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Summarizer;

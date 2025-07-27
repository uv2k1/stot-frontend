// client/src/SpeechToText.js
import React, { useState, useEffect } from 'react';

const SpeechToText = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [savedTranscriptions, setSavedTranscriptions] = useState([]);
    const [recognition, setRecognition] = useState(null);
    const [message, setMessage] = useState(''); // For user messages

    // Fetch saved transcriptions on component mount
    useEffect(() => {
        fetchTranscriptions();
    }, []);

    // Setup Web Speech API on component mount
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
            setMessage('Web Speech API is not supported by this browser. Try Chrome.');
            return;
        }

        const SpeechRecognition = window.webkitSpeechRecognition;
        const newRecognition = new SpeechRecognition();

        newRecognition.continuous = true; // Keep listening
        newRecognition.interimResults = true; // Show interim results
        newRecognition.lang = 'en-US'; // Set language

        newRecognition.onstart = () => {
            setIsListening(true);
            setMessage('Listening...');
        };

        newRecognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            setTranscription(finalTranscript + interimTranscript);
        };

        newRecognition.onerror = (event) => {
            setIsListening(false);
            setMessage(`Speech recognition error: ${event.error}`);
            console.error('Speech recognition error:', event.error);
        };

        newRecognition.onend = () => {
            setIsListening(false);
            setMessage('Stopped listening.');
            setTranscription((prev) => {
                if (prev.trim() === '') {
                    setMessage('No speech detected or recognized.');
                }
                return prev;
            });
        };

        setRecognition(newRecognition);

        // Cleanup on unmount
        return () => {
            if (newRecognition) {
                newRecognition.stop();
            }
        };
    }, []); // Empty dependency array means this runs once on mount

    const startListening = () => {
        if (recognition) {
            setTranscription(''); // Clear previous transcription
            setMessage('');
            try {
                recognition.start();
            } catch (e) {
                setMessage('Recognition already started or an error occurred.');
                console.error(e);
            }
        }
    };

    const stopListening = () => {
        if (recognition) {
            recognition.stop();
        }
    };

    const saveTranscription = async () => {
        if (transcription.trim() === '') {
            setMessage('Nothing to save. Please speak first.');
            return;
        }
        try {
            const response = await fetch('http://localhost:5050/api/transcriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: transcription }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSavedTranscriptions([data, ...savedTranscriptions]); // Add new transcription to the top
            setTranscription(''); // Clear current transcription after saving
            setMessage('Transcription saved successfully!');
        } catch (error) {
            setMessage(`Error saving transcription: ${error.message}`);
            console.error('Error saving transcription:', error);
        }
    };

    const fetchTranscriptions = async () => {
        try {
            const response = await fetch('http://localhost:5050/api/transcriptions');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSavedTranscriptions(data);
        } catch (error) {
            setMessage(`Error fetching transcriptions: ${error.message}`);
            console.error('Error fetching transcriptions:', error);
        }
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h1 style={{ textAlign: 'center', color: '#333' }}>Speech to Text MERN App</h1>

            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <button
                    onClick={startListening}
                    disabled={isListening}
                    style={{
                        padding: '10px 20px',
                        margin: '5px',
                        fontSize: '16px',
                        backgroundColor: isListening ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isListening ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isListening ? 'Listening...' : 'Start Listening'}
                </button>
                <button
                    onClick={stopListening}
                    disabled={!isListening}
                    style={{
                        padding: '10px 20px',
                        margin: '5px',
                        fontSize: '16px',
                        backgroundColor: isListening ? '#f44336' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: !isListening ? 'not-allowed' : 'pointer'
                    }}
                >
                    Stop Listening
                </button>
                <button
                    onClick={saveTranscription}
                    disabled={transcription.trim() === ''}
                    style={{
                        padding: '10px 20px',
                        margin: '5px',
                        fontSize: '16px',
                        backgroundColor: transcription.trim() === '' ? '#ccc' : '#008CBA',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: transcription.trim() === '' ? 'not-allowed' : 'pointer'
                    }}
                >
                    Save Transcription
                </button>
            </div>

            {message && (
                <p style={{ textAlign: 'center', color: '#f44336', fontWeight: 'bold' }}>
                    {message}
                </p>
            )}

            <div style={{ border: '1px solid #eee', padding: '15px', minHeight: '100px', borderRadius: '5px', backgroundColor: '#f9f9f9', marginBottom: '20px' }}>
                <h3 style={{ marginTop: '0', color: '#555' }}>Current Transcription:</h3>
                <p style={{ fontSize: '18px', lineHeight: '1.5', color: '#333' }}>
                    {transcription || 'Speak into your microphone...'}
                </p>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <h2 style={{ textAlign: 'center', color: '#333' }}>Saved Transcriptions</h2>
                {savedTranscriptions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#777' }}>No saved transcriptions yet.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: '0' }}>
                        {savedTranscriptions.map((item) => (
                            <li key={item._id} style={{
                                backgroundColor: '#e9e9e9',
                                padding: '10px 15px',
                                margin: '8px 0',
                                borderRadius: '5px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ flex: 1, marginRight: '10px', color: '#444' }}>{item.text}</span>
                                <span style={{ fontSize: '0.8em', color: '#666' }}>
                                    {new Date(item.timestamp).toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SpeechToText;
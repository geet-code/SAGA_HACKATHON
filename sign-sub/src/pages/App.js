import React, { useState, useRef, useEffect } from 'react';
import '../App.css';

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [outputText, setOutputText] = useState('(No text detected yet)');
  const [history, setHistory] = useState('(Empty)');
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('Initializing webcam...');
  const [backendStatus, setBackendStatus] = useState('Checking backend…');

  // 1) Ping backend & start camera
  useEffect(() => {
    fetch("http://localhost:5000/ping")
      .then((r) => r.json())
      .then((d) => setBackendStatus(d.message))
      .catch(() => setBackendStatus("Backend unreachable"));

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        setMessage('Webcam ready. Click “Start Detection.”');
      })
      .catch((err) => setMessage(`Camera error: ${err.message}`));
  }, []);

  const detectHandSigns = async () => {
    if (!isRunning) return; // Prevent detection if isRunning is false

    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 128, 128);
    const base64 = canvasRef.current.toDataURL('image/jpeg');

    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const { class: cls } = await res.json();

      // Add logging to check if the backend returns the correct class
      console.log("Prediction received:", cls);

      // Validate class index is within A-Z range (0-25)
      if (cls >= 0 && cls <= 25) {
        const letter = String.fromCharCode(65 + cls); // Convert to A-Z letter
        setOutputText((prev) =>
          prev === '(No text detected yet)' ? letter : prev + letter
        );
        setHistory((prev) =>
          prev === '(Empty)' ? letter : prev + letter
        );
      } else {
        console.log("Invalid class detected:", cls); // Invalid class debug
      }
    } catch (err) {
      console.error('Prediction error:', err);
    }

    // Only call detectHandSigns again if detection is still running
    if (isRunning) {
      setTimeout(detectHandSigns, 1000);
    }
  };

  // 3) Controls
  const startDetection = () => {
    setOutputText('');
    setHistory('');
    setIsRunning(true);
    detectHandSigns(); // Start detection immediately after setting isRunning to true
  };

  const stopDetection = () => {
    setIsRunning(false); // This will prevent further frames from being processed
    setOutputText('Detection Stopped');
  };

  const clearText = () => {
    setOutputText('(No text detected yet)');
    setHistory('(Empty)');
  };

  return (
    <div className="app-container">
      <h1>Sign SUB</h1>
      <h3>The VIDEO‑TO‑TEXT Converter</h3>

      <div className="message">{message}</div>
      <div className="message">
        <strong>Backend:</strong> {backendStatus}
      </div>

      <div className="container">
        <div className="video-section">
          <video ref={videoRef} autoPlay playsInline muted width="320" height="240" />
          <canvas ref={canvasRef} width="128" height="128" style={{ display: 'none' }} />
          <div className="buttons">
            <button onClick={startDetection} className="green">
              Start Detection
            </button>
            <button onClick={stopDetection} className="red" disabled={!isRunning}>
              Stop Detection
            </button>
            <button onClick={clearText} className="blue">
              Clear Text
            </button>
          </div>
        </div>

        <div className="output-section">
          <p>
            <strong>Detected Text:</strong>
          </p>
          <div className="output">{outputText}</div>
          <p>
            <strong>Recognition History:</strong>
          </p>
          <div className="history">{history}</div>
        </div>
      </div>

      <div className="instructions">
        <h3>How to use:</h3>
        <ol>
          <li>Allow camera access</li>
          <li>Click “Start Detection”</li>
          <li>Make signs</li>
          <li>Stop or clear as needed</li>
        </ol>
      </div>
    </div>
  );
}

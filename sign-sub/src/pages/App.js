import React, { useState, useRef, useEffect } from 'react';
import '../App.css';

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState('Initializing webcam...');
  const [backendStatus, setBackendStatus] = useState('Checking backend…');
  const [isRunning, setIsRunning] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:5000/ping');
        const data = await res.json();
        setBackendStatus(data.message);
      } catch {
        setBackendStatus('Backend unreachable');
      }
    };
    checkBackend();

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
        setMessage('Webcam ready. Click “Start Detection.”');
      })
      .catch(err => setMessage(`Camera error: ${err.message}`));
  }, []);

  // Capture and send image to backend
  const captureAndSendImage = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: JSON.stringify({ image: imageData }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setProcessedImage(url); // Set the image URL to display it
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  };

  const start = () => {
    setIsRunning(true);
    captureAndSendImage();  // Capture image at start
  };

  const stop = () => setIsRunning(false);

  return (
    <div className="app-container">
      <h1>Sign SUB</h1>
      <h3>The VIDEO‑TO‑TEXT Converter</h3>
      <div className="message">{message}</div>
      <div className="message"><strong>Backend:</strong> {backendStatus}</div>

      <div className="container">
        <div className="video-section">
          <video ref={videoRef} autoPlay playsInline muted width="320" height="240" />
          <canvas
            ref={canvasRef}
            width="320"
            height="240"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          />

          <div className="buttons">
            <button onClick={start} className="green" disabled={isRunning}>Start Detection</button>
            <button onClick={stop} className="red" disabled={!isRunning}>Stop Detection</button>
          </div>
        </div>

        <div className="output-section">
          <p><strong>Detected Gestures:</strong></p>
          {processedImage && <img src={processedImage} alt="Processed" />}
        </div>
      </div>

      <div className="instructions">
        <h3>How to use:</h3>
        <ol>
          <li>Allow camera access</li>
          <li>Click “Start Detection”</li>
          <li>Make hand gestures</li>
          <li>Click “Stop Detection” to pause</li>
        </ol>
      </div>
    </div>
  );
}

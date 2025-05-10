import React, { useState, useRef, useEffect } from 'react';
import * as handpose from '@tensorflow-models/handpose';
import '@tensorflow/tfjs';
import '../App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [outputText, setOutputText] = useState('(No text detected yet)');
  const [history, setHistory] = useState('(Empty)');
  const [model, setModel] = useState(null);
  const [message, setMessage] = useState('Initializing webcam...');

  // Loading handpose model
  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await handpose.load();
      setModel(loadedModel);
      console.log('Handpose model loaded');
    };

    loadModel();

    // Setup webcam
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
      setMessage('Webcam ready. Click "Start Detection".');
    }).catch((error) => {
      setMessage(`Error accessing camera: ${error.message}`);
    });
  }, []);

  const startDetection = () => {
    setOutputText('');
    setHistory('');
    detectHandSigns();
  };

  const stopDetection = () => {
    // Implement stop detection logic here
  };

  const clearText = () => {
    setOutputText('(No text detected yet)');
    setHistory('(Empty)');
  };

  const detectHandSigns = async () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);

    const predictions = await model.estimateHands(videoRef.current);

    if (predictions.length > 0) {
      const detectedSign = 'A'; // Replace this with actual detection logic
      setOutputText((prev) => prev + detectedSign);
      setHistory((prev) => prev + detectedSign);
    }

    requestAnimationFrame(detectHandSigns);
  };

  return (
    <div className="app-container">
      <h1>Sign Language to Text Converter</h1>
      
      <div className="message">{message}</div>

      <div className="container">
        <div className="video-section">
          <p><strong>Camera Feed:</strong></p>
          <video ref={videoRef} autoPlay playsInline muted width="320" height="240" />
          <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />

          <div className="buttons">
            <button onClick={startDetection} className="green">Start Detection</button>
            <button onClick={stopDetection} className="red" disabled>Stop Detection</button>
            <button onClick={clearText} className="blue">Clear Text</button>
          </div>
        </div>

        <div className="output-section">
          <p><strong>Detected Text:</strong></p>
          <div className="output">{outputText}</div>

          <p><strong>Recognition History:</strong></p>
          <div className="history">{history}</div>
        </div>
      </div>

      <div className="instructions">
        <h3>How to use:</h3>
        <ol>
          <li>Allow camera access when prompted</li>
          <li>Click "Start Detection" to begin sign language recognition</li>
          <li>Make ASL hand signs in front of the camera</li>
          <li>The detected letters will appear in the text area</li>
          <li>Click "Stop Detection" to pause</li>
          <li>Click "Clear Text" to reset</li>
        </ol>
        <p><em>Note: This demo uses random predictions. Integrate a trained model for actual results.</em></p>
      </div>
    </div>
  );
}

export default App;

const signToTextMapping = {
    0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E',
    5: 'F', 6: 'G', 7: 'H', 8: 'I', 9: 'J',
    10: 'K', 11: 'L', 12: 'M', 13: 'N', 14: 'O',
    15: 'P', 16: 'Q', 17: 'R', 18: 'S', 19: 'T',
    20: 'U', 21: 'V', 22: 'W', 23: 'X', 24: 'Y',
    25: 'Z', 26: 'SPACE'
  };

  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const outputText = document.getElementById('outputText');
  const history = document.getElementById('history');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const message = document.getElementById('message');

  let isRunning = false;
  let animationFrameId = null;
  let lastDetectedSign = '';
  let detectedText = '';
  let recognitionHistory = [];

  async function initCamera() {
    try {
      message.textContent = "Initializing webcam...";
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });
      video.srcObject = stream;
      message.textContent = "Webcam ready. Click 'Start Detection'.";
    } catch (error) {
      message.textContent = "Error accessing camera: " + error.message;
    }
  }

  function startDetection() {
    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    outputText.textContent = '';
    recognitionHistory = [];
    history.innerHTML = '';
    detectedText = '';
    processFrame();
  }

  function stopDetection() {
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    cancelAnimationFrame(animationFrameId);
  }

  function clearText() {
    detectedText = '';
    recognitionHistory = [];
    outputText.textContent = '(No text detected yet)';
    history.innerHTML = '(Empty)';
  }

  function processFrame() {
    if (!isRunning) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simulate prediction
    const classIndex = Math.floor(Math.random() * 27);
    const detectedSign = signToTextMapping[classIndex];

    if (detectedSign !== lastDetectedSign) {
      lastDetectedSign = detectedSign;

      if (detectedSign === 'SPACE') {
        detectedText += ' ';
        recognitionHistory.push(' ');
      } else {
        detectedText += detectedSign;
        recognitionHistory.push(detectedSign);
      }

      outputText.textContent = detectedText;
      history.innerHTML = '';
      recognitionHistory.forEach(letter => {
        const span = document.createElement('span');
        span.textContent = letter;
        history.appendChild(span);
      });
    }

    animationFrameId = requestAnimationFrame(processFrame);
  }

  // Setup
  initCamera();

  startBtn.addEventListener('click', startDetection);
  stopBtn.addEventListener('click', stopDetection);
  clearBtn.addEventListener('click', clearText);

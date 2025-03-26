import React, { useState, useEffect, useRef } from 'react';
    import { ToastContainer, toast } from 'react-toastify';
    import 'react-toastify/dist/ReactToastify.css';
    import axios from 'axios';
    import * as tf from '@tensorflow/tfjs';
    import * as cocoSsd from '@tensorflow-models/coco-ssd';
    import './App.css';

    function App() {
      const [cameraStatus, setCameraStatus] = useState('Loading...');
      const [modelOutput, setModelOutput] = useState('Model not running');
      const [animalDescription, setAnimalDescription] = useState('');
      const videoRef = useRef(null);
      const [isCameraReady, setIsCameraReady] = useState(false);
      const [model, setModel] = useState(null);

      useEffect(() => {
        const loadCamera = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setCameraStatus('Camera is ON');
              setIsCameraReady(true);
            }
          } catch (error) {
            setCameraStatus(`Camera Error: ${error.message}`);
          }
        };

        loadCamera();

        return () => {
          if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
          }
        };
      }, []);

      useEffect(() => {
        async function loadCocoSsd() {
          try {
            const loadedModel = await cocoSsd.load();
            setModel(loadedModel);
            console.log('COCO-SSD model loaded successfully');
          } catch (error) {
            console.error('Error loading COCO-SSD model:', error);
            setModelOutput(`Model Load Error: ${error.message}`);
          }
        }

        loadCocoSsd();
      }, []);

      useEffect(() => {
        if (isCameraReady && model) {
          const processFrame = async () => {
            if (!videoRef.current || !model) return;

            try {
              const predictions = await model.detect(videoRef.current);

              let animalPrediction = null;
              let maxConfidence = 0;

              const wildAnimals = ['bird', 'cat', 'dog', 'bear', 'lion', 'tiger', 'zebra', 'elephant', 'giraffe', 'deer', 'fox', 'wolf', 'monkey', 'squirrel', 'rabbit'];

              predictions.forEach(prediction => {
                if (wildAnimals.includes(prediction.class)) {
                  if (prediction.score > maxConfidence) {
                    maxConfidence = prediction.score;
                    animalPrediction = prediction.class;
                  }
                }
              });

              if (animalPrediction) {
                setModelOutput(`${animalPrediction} (Confidence: ${maxConfidence.toFixed(2)})`);
                if (maxConfidence > 0.7) {
                  toast.success(`Animal Detected: ${animalPrediction}`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                  });
                  fetchAnimalDescription(animalPrediction);
                }
              } else {
                setModelOutput('No wild animal detected');
              }
            } catch (error) {
              setModelOutput(`Model Error: ${error.message}`);
            }
            requestAnimationFrame(processFrame);
          };
          processFrame();
        }
      }, [isCameraReady, model]);

      const fetchAnimalDescription = async (animalName) => {
        try {
          const response = await axios.post('/describe', { animal: animalName });
          setAnimalDescription(response.data.description);
        } catch (error) {
          setAnimalDescription(`Description Error: ${error.message}`);
        }
      };

      return (
        <div className="app-container">
          <h1>Wild Animal Detection</h1>
          <div className="camera-section">
            <h2>Camera Feed</h2>
            <p>Status: {cameraStatus}</p>
            {isCameraReady && (
              <video ref={videoRef} autoPlay playsInline muted width="640" height="480" />
            )}
          </div>
          <div className="model-section">
            <h2>Model Output</h2>
            <p>{modelOutput}</p>
          </div>
          <div className="description-section">
            <h2>Animal Description</h2>
            <p>{animalDescription}</p>
          </div>
          <ToastContainer />
        </div>
      );
    }

    export default App;

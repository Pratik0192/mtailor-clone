import React, { useRef, useState } from 'react'
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import * as drawingUtils from "@mediapipe/drawing_utils"
import * as mpPose from "@mediapipe/pose"

const CaptureMeasurement = () => {

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [measurements, setMeasurements] = useState(null);
  const [capturedMeasurement, setCapturedMeasurement] = useState(null); // Store finalized measurement
  const [poseInstance, setPoseInstance] = useState(null); // Reference to the Pose instance


  //initialize mediapipe pose
  const initializePose = () => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity:1,
      smoothLandmarks: true,
      enableSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(onPoseResults);
    setPoseInstance(pose);

    if(videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    } else {
      console.error("video element is not available")
    }
  };

  //handle pose
  const onPoseResults = (results) => {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    //draw landmarks
    if (results.poseLandmarks) {
      drawingUtils.drawLandmarks(canvasCtx, results.poseLandmarks, mpPose.POSE_LANDMARKS);

      const leftShoulder = results.poseLandmarks[11];
      const rightShoulder = results.poseLandmarks[12];

      //for depth calculation
      const zscale = Math.abs(leftShoulder.z + rightShoulder.z) / 2;

      const shoulderWidth = Math.sqrt(
        Math.pow(rightShoulder.x - leftShoulder.x, 2) + Math.pow(rightShoulder.y - leftShoulder.y, 2)
      );

      const adjustedShoulderWidth = shoulderWidth / zscale;

      if (!capturedMeasurement) {
        setMeasurements({ 
          shoulderWidth: (adjustedShoulderWidth * 100).toFixed(2) 
        });
      }
    }
  };

  const startCamera = () => {
    setIsCameraOpen(true);

    if (videoRef.current) {
      console.log("starting camera...");
      videoRef.current.play();
      initializePose();
    } else {
      console.error("video element is not initialized");
    }
  }

  const finalizeMeasurement = () => {
    setCapturedMeasurement(measurements);
    if(poseInstance) {
      poseInstance.close();
    }
    if( videoRef.current) {
      videoRef.current.pause();
    }
  }

  return (
    <div className='flex flex-col items-center px-4 py-6 space-y-6'>
      <button 
        onClick={startCamera}
        className='bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300' 
      >
        Take measurement
      </button>
      {isCameraOpen && (
        <div className='relative w-full max-w-lg h-[320px] md:h-[480px] '>
          <video
            ref={videoRef}
            className='absolute top-0 left-0 w-full h-full'
            autoPlay
            muted
            playsInline
          />

          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className='absolute top-0 left-0 w-full h-full rounded-lg shadow-md border border-gray-300'
          />
        </div>
      )}

      {isCameraOpen && measurements && !capturedMeasurement && (
        <button 
          onClick={finalizeMeasurement}
          className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-green-700 transition duration-300"
        >
          Capure Measurement
        </button>
      )}

      {measurements && (
        <div className='w-full max-w-lg bg-white rounded-lg shadow-md p-4 text-center'>
          <h3 className='text-lg font-bold text-gray-800 mb-2'>Measurements</h3>
          <p className='text-gray-600 text-sm'>
            <span className="font-semibold">Shoulder Width</span> {" "}
            {measurements.shoulderWidth} cm
          </p>
        </div>
      )}
    </div>
  )
}

export default CaptureMeasurement
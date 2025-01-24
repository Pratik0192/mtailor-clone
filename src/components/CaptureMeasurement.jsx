import React, { useRef, useState } from 'react'

const CaptureMeasurement = () => {

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);

  const startCamera = async () => {
    setIsCameraOpen(true);
    if(navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  }

  return (
    <div>
      <button onClick={startCamera}>
        Take measurement
      </button>
      {setIsCameraOpen && <video ref={videoRef} style={{width: "100%"}} /> }
    </div>
  )
}

export default CaptureMeasurement
import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ stream, muted = false, className = '', version = 0 }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, version]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`w-full h-full object-cover ${className}`}
    />
  );
};

export default VideoPlayer;

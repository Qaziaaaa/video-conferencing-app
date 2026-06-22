import React, { useEffect, useRef } from 'react';

/**
 * Renders a single video tile for a participant stream.
 *
 * @param {MediaStream|null} stream - The media stream to display.
 * @param {boolean} [muted=false] - MUST only be true for the local self-view tile. Never pass muted=true for a remote participant's stream.
 * @param {string} [className=''] - Additional CSS classes to apply to the video element.
 * @param {number} [version=0] - Increment to force a srcObject reassignment when the stream object reference is unchanged.
 */
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
      style={{ willChange: 'transform' }}
    />
  );
};

export default VideoPlayer;

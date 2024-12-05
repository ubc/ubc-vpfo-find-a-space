import React from 'react';

const offScreenStyle = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  width: '1px',
  position: 'absolute',
};

export default function Announcer({ message, ariaLive }) {
  return (
    <div
      style={offScreenStyle}
      role="log"
      aria-live={ariaLive}
      aria-relevant="additions"
      aria-atomic="true">
      {message ? message : ''}
    </div>
  );
}

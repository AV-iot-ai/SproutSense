import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import './ElasticSlider.css';

const MAX_OVERFLOW = 50;

export default function ElasticSlider({
  defaultValue = 50,
  startingValue = 0,
  maxValue = 100,
  className = '',
  isStepped = false,
  stepSize = 1,
  leftIcon = (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
    </svg>
  ),
  rightIcon = (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9v6h4l5 4V5L7 9H3zm13 3c0-1.77-1.02-3.29-2.5-4.03v8.06A5.01 5.01 0 0 0 16 12z" />
    </svg>
  ),
  onChange
}) {
  return (
    <div className={`slider-container ${className}`}>
      <Slider
        defaultValue={defaultValue}
        startingValue={startingValue}
        maxValue={maxValue}
        isStepped={isStepped}
        stepSize={stepSize}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        onChange={onChange}
      />
    </div>
  );
}

function Slider({ defaultValue, startingValue, maxValue, isStepped, stepSize, leftIcon, rightIcon, onChange }) {
  const [value, setValue] = useState(defaultValue);
  const sliderRef = useRef(null);
  const [region, setRegion] = useState('middle');
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useMotionValueEvent(clientX, 'change', latest => {
    if (sliderRef.current) {
      const { left, right } = sliderRef.current.getBoundingClientRect();
      let newValue;

      if (latest < left) {
        setRegion('left');
        newValue = left - latest;
      } else if (latest > right) {
        setRegion('right');
        newValue = latest - right;
      } else {
        setRegion('middle');
        newValue = 0;
      }

      overflow.jump(decay(newValue, MAX_OVERFLOW));
    }
  });

  const handlePointerMove = e => {
    if (e.buttons > 0 && sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect();
      let newValue = startingValue + ((e.clientX - left) / width) * (maxValue - startingValue);

      if (isStepped) {
        newValue = Math.round(newValue / stepSize) * stepSize;
      }

      newValue = Math.min(Math.max(newValue, startingValue), maxValue);
      setValue(newValue);
      if (typeof onChange === 'function') onChange(newValue);
      clientX.jump(e.clientX);
    }
  };

  const handlePointerDown = e => {
    handlePointerMove(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    animate(overflow, 0, { type: 'spring', bounce: 0.5 });
  };

  const getRangePercentage = () => {
    const totalRange = maxValue - startingValue;
    if (totalRange === 0) return 0;

    return ((value - startingValue) / totalRange) * 100;
  };

  return (
    <>
      <motion.div
        onHoverStart={() => animate(scale, 1.2)}
        onHoverEnd={() => animate(scale, 1)}
        onTouchStart={() => animate(scale, 1.2)}
        onTouchEnd={() => animate(scale, 1)}
        style={{
          scale,
          opacity: useTransform(scale, [1, 1.2], [0.7, 1])
        }}
        className="slider-wrapper"
      >
          <button
            className="slider-btn slider-btn-left"
            onClick={() => {
              // decrement by stepSize
              const newValue = Math.max(startingValue, Math.round((value - (isStepped ? stepSize : 1))));
              setValue(newValue);
              if (typeof onChange === 'function') onChange(newValue);
            }}
            aria-label="Decrease"
          >
            <svg className="icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="11" width="16" height="2" rx="1"/></svg>
          </button>

        <div
          ref={sliderRef}
          className="slider-root"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <motion.div
            style={{
              scaleX: useTransform(() => {
                if (sliderRef.current) {
                  const { width } = sliderRef.current.getBoundingClientRect();
                  return 1 + overflow.get() / width;
                }
                return 1;
              }),
              scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
              transformOrigin: useTransform(() => {
                if (sliderRef.current) {
                  const { left, width } = sliderRef.current.getBoundingClientRect();
                  return clientX.get() < left + width / 2 ? 'right' : 'left';
                }
                return 'left';
              }),
              height: useTransform(scale, [1, 1.2], [6, 12]),
              marginTop: useTransform(scale, [1, 1.2], [0, -3]),
              marginBottom: useTransform(scale, [1, 1.2], [0, -3])
            }}
            className="slider-track-wrapper"
          >
            <div className="slider-track">
              <div className="slider-range" style={{ width: `${getRangePercentage()}%` }} />
            </div>
          </motion.div>
        </div>

        <button
          className="slider-btn slider-btn-right"
          onClick={() => {
            // increment by stepSize
            const newValue = Math.min(maxValue, Math.round((value + (isStepped ? stepSize : 1))));
            setValue(newValue);
            if (typeof onChange === 'function') onChange(newValue);
          }}
          aria-label="Increase"
        >
          <svg className="icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="11" y="4" width="2" height="16" rx="1"/><rect x="4" y="11" width="16" height="2" rx="1"/></svg>
        </button>
      </motion.div>
      <p className="value-indicator">{Math.round(value)}</p>
    </>
  );
}

function decay(value, max) {
  if (max === 0) {
    return 0;
  }

  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);

  return sigmoid * max;
}

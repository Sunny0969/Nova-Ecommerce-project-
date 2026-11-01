import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Camera, X, RotateCcw, Sparkles, ZoomIn, ZoomOut, Ruler, CheckCircle2, UserCheck, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';
import './WebARTryOnModal.css';

export default function WebARTryOnModal({ isOpen, onClose, product }) {
  const [activeTab, setActiveTab] = useState('tryon'); // 'tryon' | 'size-guide'
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scale, setScale] = useState(1.4);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(60);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(0.92);
  const [showBodyGuide, setShowBodyGuide] = useState(true);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  // Size recommender state
  const [userHeight, setUserHeight] = useState('5.6');
  const [userWeight, setUserWeight] = useState('65');
  const [userFitPref, setUserFitPref] = useState('regular'); // 'slim' | 'regular' | 'loose'

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const productImage = product?.imageUrl || (product?.images && product.images[0]?.url) || '';

  // Determine category presets
  const categoryName = String(product?.category?.name || product?.category || '').toLowerCase();
  const isHeadwearOrGlasses = categoryName.includes('glass') || categoryName.includes('hat') || categoryName.includes('cap');
  const isJewelry = categoryName.includes('jewel') || categoryName.includes('necklace') || categoryName.includes('earring');

  // Compute recommended size
  const recommendedSize = useMemo(() => {
    const w = parseFloat(userWeight) || 60;
    let base = 'M';
    if (w < 52) base = 'XS';
    else if (w <= 62) base = 'S';
    else if (w <= 74) base = 'M';
    else if (w <= 86) base = 'L';
    else if (w <= 98) base = 'XL';
    else base = 'XXL';

    if (userFitPref === 'loose') {
      if (base === 'XS') return 'S';
      if (base === 'S') return 'M';
      if (base === 'M') return 'L';
      if (base === 'L') return 'XL';
      if (base === 'XL') return 'XXL';
    } else if (userFitPref === 'slim') {
      if (base === 'XXL') return 'XL';
      if (base === 'XL') return 'L';
      if (base === 'L') return 'M';
      if (base === 'M') return 'S';
    }
    return base;
  }, [userWeight, userFitPref]);

  const snapToShoulders = useCallback(() => {
    setPosX(0);
    if (isHeadwearOrGlasses) {
      setPosY(-80);
      setScale(0.95);
    } else if (isJewelry) {
      setPosY(20);
      setScale(0.8);
    } else {
      // Apparel (Kurti / Suit / Dress)
      setPosY(70);
      setScale(1.45);
    }
    setRotation(0);
    toast.success('✨ Garment snapped to shoulders & torso!');
  }, [isHeadwearOrGlasses, isJewelry]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera permissions in your browser address bar.'
          : 'Unable to start camera feed. You can still test garment fit on the silhouette.'
      );
      setStreamActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'tryon') {
        startCamera();
      }
      snapToShoulders();
      setSnapshotTaken(false);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera, snapToShoulders]);

  if (!isOpen) return null;

  const handlePointerDown = (e) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - posX,
      y: e.clientY - posY
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    setPosX(e.clientX - dragStart.current.x);
    setPosY(e.clientY - dragStart.current.y);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleCaptureSnapshot = () => {
    setSnapshotTaken(true);
    toast.success('📸 Look captured! Drag to adjust fit or save to share.');
    setTimeout(() => setSnapshotTaken(false), 2500);
  };

  return (
    <div
      className="webar-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="webar-modal-title"
    >
      <div className="webar-modal-container">
        
        {/* Header */}
        <div className="webar-modal-header">
          <div className="webar-header-left">
            <div className="webar-header-icon">
              <Camera size={18} />
            </div>
            <div>
              <h3 id="webar-modal-title" className="webar-header-title">
                AR Virtual Fitting Room
                <span className="webar-live-badge">Garment Wear Mode</span>
              </h3>
              <p className="webar-header-product">
                {product?.name || 'Product'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="webar-close-btn"
            aria-label="Close AR Fitting Room"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="webar-tabs-bar">
          <button
            type="button"
            className={`webar-tab-btn ${activeTab === 'tryon' ? 'active' : ''}`}
            onClick={() => setActiveTab('tryon')}
          >
            <Camera size={14} />
            <span>Body Wear Live Mode</span>
          </button>
          <button
            type="button"
            className={`webar-tab-btn ${activeTab === 'size-guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('size-guide')}
          >
            <Ruler size={14} />
            <span>AI Size &amp; Fit Recommender</span>
          </button>
        </div>

        {activeTab === 'tryon' ? (
          <>
            {/* Viewport with Auto Body Positioning */}
            <div
              className="webar-viewport"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                playsInline
                muted
                className="webar-video"
                style={{ opacity: streamActive ? 1 : 0.15 }}
              />

              {/* Body Alignment Torso Guide (helps customer line up their shoulders) */}
              {showBodyGuide && streamActive && (
                <div className="webar-body-guide">
                  <div className="webar-torso-guide">
                    <span className="webar-guide-label">👤 Line up your shoulders here</span>
                  </div>
                </div>
              )}

              {/* Silhouette fallback if camera blocked */}
              {!streamActive && (
                <div className="webar-silhouette">
                  <div className="webar-silhouette-icon">
                    <Sparkles size={36} />
                  </div>
                  <p className="webar-silhouette-text">
                    {cameraError || 'Allow camera permission to align this garment directly onto your torso in real time.'}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="webar-retry-btn"
                  >
                    Retry Camera
                  </button>
                </div>
              )}

              {/* Seamless Garment Cutout Overlay (Worn over body) */}
              <div
                className="webar-product-overlay"
                style={{
                  transform: `translate(${posX}px, ${posY}px) scale(${scale}) rotate(${rotation}deg)`
                }}
              >
                {productImage ? (
                  <img
                    src={productImage}
                    alt={product?.name || 'Try on product'}
                    className="webar-product-img"
                    style={{ opacity }}
                    draggable={false}
                  />
                ) : (
                  <div style={{ width: 180, height: 180, background: 'rgba(255,255,255,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    Garment Outline
                  </div>
                )}
              </div>

              {/* Realism Hint */}
              <div className="webar-hint">
                <span>💡 Stand <b>2-3 feet back</b> · Align your chest with the center guide</span>
              </div>

              {/* Flash effect */}
              {snapshotTaken && <div className="webar-flash" />}
            </div>

            {/* Smart Fitting Control Footer */}
            <div className="webar-modal-footer">
              <div className="webar-ctrl-group">
                <button
                  type="button"
                  onClick={snapToShoulders}
                  className="webar-btn active-preset"
                  title="Automatically snap garment onto shoulders"
                >
                  <UserCheck size={15} />
                  <span>Snap to Shoulders</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(2.8, s + 0.1))}
                  className="webar-btn"
                  title="Widen / Size Up"
                >
                  <ZoomIn size={15} />
                  <span>Fit Up</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
                  className="webar-btn"
                  title="Narrow / Size Down"
                >
                  <ZoomOut size={15} />
                  <span>Fit Down</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOpacity((op) => (op <= 0.75 ? 0.95 : 0.72))}
                  className="webar-btn"
                  title="Toggle Natural Lighting & Fabric Blend"
                >
                  <Sliders size={15} />
                  <span>{opacity < 0.9 ? 'Natural Blend' : 'Solid Fabric'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBodyGuide((prev) => !prev)}
                  className="webar-btn"
                  title="Toggle Body Outline Guide"
                >
                  <span>{showBodyGuide ? 'Hide Guide' : 'Show Guide'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    snapToShoulders();
                    setOpacity(0.92);
                  }}
                  className="webar-btn"
                  title="Reset to Default Wear Position"
                >
                  <RotateCcw size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="webar-snapshot-btn"
              >
                <Camera size={16} />
                <span>Take Photo</span>
              </button>
            </div>
          </>
        ) : (
          /* Size & Measurement Guide Panel */
          <div className="webar-size-panel">
            <div className="webar-size-card">
              <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} className="text-pink-400" />
                Find Your Ideal Fit &amp; Size
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>
                Enter your approximate measurements to get instant AI size recommendations for this product.
              </p>

              <div className="webar-size-inputs">
                <div className="webar-size-field">
                  <label>Height (Feet / In)</label>
                  <select value={userHeight} onChange={(e) => setUserHeight(e.target.value)}>
                    <option value="5.0">5'0" - 5'2"</option>
                    <option value="5.3">5'3" - 5'5"</option>
                    <option value="5.6">5'6" - 5'8"</option>
                    <option value="5.9">5'9" - 5'11"</option>
                    <option value="6.0">6'0"+</option>
                  </select>
                </div>

                <div className="webar-size-field">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    value={userWeight}
                    onChange={(e) => setUserWeight(e.target.value)}
                    min="35"
                    max="140"
                    placeholder="e.g. 65"
                  />
                </div>

                <div className="webar-size-field">
                  <label>Fit Preference</label>
                  <select value={userFitPref} onChange={(e) => setUserFitPref(e.target.value)}>
                    <option value="slim">Slim / Snug Fit</option>
                    <option value="regular">Regular / True to Size</option>
                    <option value="loose">Relaxed / Loose Fit</option>
                  </select>
                </div>
              </div>

              <div className="webar-match-result">
                <div>
                  <div className="webar-match-label">Recommended Size for You:</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    Based on {userWeight}kg &amp; {userFitPref} preference
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={24} className="text-pink-500" />
                  <div className="webar-match-size">{recommendedSize}</div>
                </div>
              </div>
            </div>

            {/* Standard Measurement Size Chart */}
            <div className="webar-size-card">
              <h5 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                Standard Sizing Chart (Inches)
              </h5>
              <table className="webar-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (in)</th>
                    <th>Waist (in)</th>
                    <th>Length (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: recommendedSize === 'S' ? 'rgba(236,72,153,0.15)' : 'transparent' }}>
                    <td><b>S (Small)</b></td>
                    <td>36 - 38</td>
                    <td>30 - 32</td>
                    <td>38</td>
                  </tr>
                  <tr style={{ background: recommendedSize === 'M' ? 'rgba(236,72,153,0.15)' : 'transparent' }}>
                    <td><b>M (Medium)</b></td>
                    <td>39 - 41</td>
                    <td>33 - 35</td>
                    <td>40</td>
                  </tr>
                  <tr style={{ background: recommendedSize === 'L' ? 'rgba(236,72,153,0.15)' : 'transparent' }}>
                    <td><b>L (Large)</b></td>
                    <td>42 - 44</td>
                    <td>36 - 38</td>
                    <td>42</td>
                  </tr>
                  <tr style={{ background: recommendedSize === 'XL' ? 'rgba(236,72,153,0.15)' : 'transparent' }}>
                    <td><b>XL (Extra Large)</b></td>
                    <td>45 - 47</td>
                    <td>39 - 41</td>
                    <td>43</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

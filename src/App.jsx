import { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { items } from './data';
import { useFrameMetrics } from './hooks/useFrameMetrics';
import './App.css';

const SlowList = lazy(() => import('./components/SlowList').then(m => ({ default: m.SlowList })));
const VanillaList = lazy(() => import('./components/VanillaList').then(m => ({ default: m.VanillaList })));
const ReactWindowList = lazy(() => import('./components/ReactWindowList').then(m => ({ default: m.ReactWindowList })));
const TanstackList = lazy(() => import('./components/TanstackList').then(m => ({ default: m.TanstackList })));
const VirtuosoList = lazy(() => import('./components/VirtuosoList').then(m => ({ default: m.VirtuosoList })));

const TABS = [
  {
    id: 'slow',
    label: 'No Virtualization',
    tag: 'naive',
    tagColor: '#dc2626',
    description: 'All 12,000 items rendered into the DOM at once. Scroll to feel it.',
  },
  {
    id: 'vanilla',
    label: 'Vanilla JS',
    tag: 'from scratch',
    tagColor: '#7c3aed',
    description: 'Core virtualization logic hand-rolled with React state — no library. Fixed item height, absolute positioning, scroll listener.',
  },
  {
    id: 'react-window',
    label: 'react-window',
    tag: '6.5 KB gz',
    tagColor: '#0284c7',
    description: 'Fixed-size list. Minimal API: give it a height, count, and render function. Smallest and most battle-tested.',
  },
  {
    id: 'tanstack',
    label: '@tanstack/react-virtual',
    tag: '5.3 KB gz',
    tagColor: '#0284c7',
    description: 'Headless — you own the markup. Most flexible and lightest gzipped. Variable heights without manual measurement.',
  },
  {
    id: 'virtuoso',
    label: 'react-virtuoso',
    tag: '18.4 KB gz',
    tagColor: '#0284c7',
    description: 'Highest-level API. Variable heights, reverse scroll (chat UIs), sticky headers, and infinite scroll out of the box.',
  },
];

// Measures time from first render to post-paint useEffect.
// key prop on this component must change to remeasure on tab switch.
function MountTimer({ onMount, children }) {
  const startRef = useRef(performance.now());
  useEffect(() => {
    onMount(Math.round(performance.now() - startRef.current));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return children;
}

function DomCounter({ containerId }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(containerId);
      if (el) setCount(el.querySelectorAll('*').length);
    };
    update();
    const id = setInterval(update, 400);
    return () => clearInterval(id);
  }, [containerId]);

  return <span>{count === null ? '—' : count.toLocaleString()}</span>;
}

function fpsClass(fps) {
  if (fps === null) return '';
  if (fps >= 55) return 'good';
  if (fps >= 30) return 'warn';
  return 'bad';
}

function frameClass(ms) {
  if (ms === 0) return 'good';
  if (ms <= 25) return 'good';
  if (ms <= 50) return 'warn';
  return 'bad';
}

function dropsClass(n) {
  if (n === 0) return 'good';
  if (n <= 5) return 'warn';
  return 'bad';
}

function LoadingFallback() {
  return <div className="loading-fallback">Loading…</div>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('slow');
  const listRef = useRef(null);
  const [listHeight, setListHeight] = useState(500);
  const [renderTime, setRenderTime] = useState(null);

  const { fps, droppedFrames, worstFrame } = useFrameMetrics(activeTab);

  const handleTabChange = (id) => {
    setRenderTime(null);
    setActiveTab(id);
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    setListHeight(el.clientHeight);
    const ro = new ResizeObserver(entries => {
      setListHeight(entries[0].contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tab = TABS.find(t => t.id === activeTab);

  return (
    <div className="app">
      <header className="app-header">
        <h1>List Virtualization Demo</h1>
        <p>{items.length.toLocaleString()} items — compare rendering strategies side by side</p>
      </header>

      <nav className="tab-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => handleTabChange(t.id)}
          >
            {t.label}
            <span
              className="tab-tag"
              style={{ color: t.tagColor, background: t.tagColor + '1a' }}
            >
              {t.tag}
            </span>
          </button>
        ))}
      </nav>

      <div className="info-bar">
        <p>{tab.description}</p>
        <div className="dom-counter-badge">
          <DomCounter containerId={`list-container-${activeTab}`} />
          {' '}DOM nodes
        </div>
      </div>

      <div className="metrics-bar">
        <div className="metric">
          <span className="metric__label">FPS</span>
          <span className={`metric__value ${fpsClass(fps)}`}>
            {fps === null ? '—' : fps}
          </span>
        </div>
        <div className="metric">
          <span className="metric__label">Dropped frames</span>
          <span className={`metric__value ${dropsClass(droppedFrames)}`}>
            {droppedFrames}
          </span>
        </div>
        <div className="metric">
          <span className="metric__label">Worst frame</span>
          <span className={`metric__value ${frameClass(worstFrame)}`}>
            {worstFrame === 0 ? '—' : worstFrame}
          </span>
          {worstFrame > 0 && <span className="metric__unit">ms</span>}
        </div>
        <div className="metric">
          <span className="metric__label">Render time</span>
          <span className="metric__value">
            {renderTime === null ? '…' : renderTime}
          </span>
          {renderTime !== null && <span className="metric__unit">ms</span>}
        </div>
      </div>

      <div className="list-area">
        <div ref={listRef} className="list-card">
          <div className="list-header-row">
            <span className="col-avatar" />
            <span className="col-name">Name / Email</span>
            <span className="col-dept">Dept.</span>
            <span className="col-status">Status</span>
          </div>

          <div id={`list-container-${activeTab}`} className="list-body">
            <Suspense fallback={<LoadingFallback />}>
              <MountTimer key={activeTab} onMount={setRenderTime}>
                {activeTab === 'slow' && <SlowList />}
                {activeTab === 'vanilla' && <VanillaList />}
                {activeTab === 'react-window' && <ReactWindowList height={listHeight - 36} />}
                {activeTab === 'tanstack' && <TanstackList />}
                {activeTab === 'virtuoso' && <VirtuosoList />}
              </MountTimer>
            </Suspense>
          </div>
        </div>
      </div>

      <div className="app-footer">
        Scroll fast on each tab to see frame drops accumulate. Render time measures React mount + first paint.
      </div>
    </div>
  );
}

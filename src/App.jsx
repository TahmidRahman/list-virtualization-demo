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

const METRIC_TIPS = {
  fps: {
    title: 'Frames Per Second',
    body: '1-second rolling average of how many frames the browser renders. 60 fps is the target for smooth UI. Below 55 becomes noticeable; below 30 feels sluggish. Measured via requestAnimationFrame.',
    good: '≥ 55 fps',
    bad: '< 30 fps',
  },
  dropped: {
    title: 'Dropped Frames',
    body: 'Cumulative count of frames that took longer than 25 ms since this tab opened. Each one means the browser missed its 16.67 ms budget, causing visible jank. Resets on tab switch.',
    good: '0 drops',
    bad: 'Any drops during scroll',
  },
  worst: {
    title: 'Worst Frame',
    body: 'The single longest frame delta recorded since this tab opened. A frame over 50 ms means the main thread was blocked — usually by layout, scripting, or DOM mutation. Resets on tab switch.',
    good: '< 25 ms',
    bad: '> 50 ms',
  },
  render: {
    title: 'Render Time',
    body: 'Time from when React starts mounting the list to when the browser finishes painting it (measured via useEffect). Includes React reconciliation and DOM mutation. Resets on tab switch.',
    good: '< 50 ms',
    bad: '> 500 ms',
  },
  dom: {
    title: 'Live DOM Nodes',
    body: 'Count of DOM elements inside the list container, sampled every 400 ms. Virtualized lists keep this near-constant (~20–30) regardless of data size. The naive approach creates one node per item.',
    good: '~20–30 nodes',
    bad: '> 10,000 nodes',
  },
};

function InfoTip({ id, alignLeft, alignRight }) {
  const tip = METRIC_TIPS[id];
  const modifier = alignLeft ? ' info-tip--align-left' : alignRight ? ' info-tip--align-right' : '';
  return (
    <span className={`info-tip${modifier}`}>
      <button className="info-tip__btn" type="button" aria-label={`About ${tip.title}`}>
        ?
      </button>
      <span className="info-tip__content" role="tooltip">
        <strong style={{ display: 'block', marginBottom: '4px', color: '#f8fafc' }}>{tip.title}</strong>
        {tip.body}
        <span style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
          <span style={{ color: '#4ade80', fontSize: '0.65rem' }}>✓ {tip.good}</span>
          <span style={{ color: '#f87171', fontSize: '0.65rem' }}>✗ {tip.bad}</span>
        </span>
      </span>
    </span>
  );
}

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
  if (ms === 0) return '';
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

const GitHubIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

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
        <div className="app-header__text">
          <h1>List Virtualization Demo</h1>
          <p>{items.length.toLocaleString()} items — compare rendering strategies side by side</p>
        </div>
        <a
          className="github-link"
          href="https://github.com/TahmidRahman/list-virtualization-demo"
          target="_blank"
          rel="noreferrer"
          aria-label="View source on GitHub"
        >
          <GitHubIcon />
          GitHub
        </a>
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
          {' '}<InfoTip id="dom" alignRight />
        </div>
      </div>

      <div className="metrics-bar">
        <div className="metric">
          <span className="metric__label">FPS</span>
          <InfoTip id="fps" alignLeft />
          <span className={`metric__value ${fpsClass(fps)}`}>
            {fps === null ? '—' : fps}
          </span>
        </div>
        <div className="metric">
          <span className="metric__label">Dropped frames</span>
          <InfoTip id="dropped" />
          <span className={`metric__value ${dropsClass(droppedFrames)}`}>
            {droppedFrames}
          </span>
        </div>
        <div className="metric">
          <span className="metric__label">Worst frame</span>
          <InfoTip id="worst" />
          <span className={`metric__value ${frameClass(worstFrame)}`}>
            {worstFrame === 0 ? '—' : worstFrame}
          </span>
          {worstFrame > 0 && <span className="metric__unit">ms</span>}
        </div>
        <div className="metric">
          <span className="metric__label">Render time</span>
          <InfoTip id="render" alignRight />
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

import { useEffect, useRef, useState } from 'react';
import { items } from '../data';
import { ListItem } from './ListItem';
import './components.css';

const ITEM_HEIGHT = 60;
const OVERSCAN = 5;

export function VanillaList() {
  const outerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    setViewportHeight(el.clientHeight);

    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const totalHeight = items.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + viewportHeight) / ITEM_HEIGHT) + OVERSCAN
  );
  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div ref={outerRef} className="vanilla-list">
      {/* Inner spacer: sets the full scrollable height */}
      <div className="vanilla-list__spacer" style={{ height: totalHeight }}>
        {visibleItems.map((item, i) => (
          <div
            key={item.id}
            className="vanilla-list__row"
            style={{ top: (startIndex + i) * ITEM_HEIGHT }}
          >
            <ListItem item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { items } from '../data';
import { ListItem } from './ListItem';
import './components.css';

export function TanstackList() {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="tanstack-scroll">
      <div className="tanstack-spacer" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(row => (
          <div
            key={row.key}
            className="tanstack-row"
            style={{ transform: `translateY(${row.start}px)` }}
          >
            <ListItem item={items[row.index]} style={{ height: row.size }} />
          </div>
        ))}
      </div>
    </div>
  );
}

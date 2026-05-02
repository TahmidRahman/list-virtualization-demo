import { List } from 'react-window';
import { items } from '../data';
import { ListItem } from './ListItem';
import './components.css';

// v2 API: rowComponent receives { index, style, ...rowProps }
function Row({ index, style }) {
  return <ListItem item={items[index]} style={style} />;
}

export function ReactWindowList({ height }) {
  return (
    <List
      className="react-window-list"
      style={{ height }}
      rowComponent={Row}
      rowCount={items.length}
      rowHeight={60}
      rowProps={{}}
    />
  );
}

import { items } from '../data';
import { ListItem } from './ListItem';
import './components.css';

export function SlowList() {
  return (
    <div className="slow-list">
      {items.map(item => (
        <ListItem key={item.id} item={item} />
      ))}
    </div>
  );
}

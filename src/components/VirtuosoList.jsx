import { Virtuoso } from 'react-virtuoso';
import { items } from '../data';
import { ListItem } from './ListItem';
import './components.css';

export function VirtuosoList() {
  return (
    <Virtuoso
      className="virtuoso-list"
      totalCount={items.length}
      itemContent={index => <ListItem item={items[index]} />}
    />
  );
}

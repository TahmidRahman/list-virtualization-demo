import './components.css';

export function ListItem({ item, style }) {
  const statusColor = {
    Active: '#16a34a',
    Inactive: '#6b7280',
    Pending: '#d97706',
    Suspended: '#dc2626',
  }[item.status];

  return (
    <div className="list-item" style={style}>
      <span className="list-item__avatar">{item.avatar}</span>
      <div className="list-item__info">
        <div className="list-item__name">{item.name}</div>
        <div className="list-item__email">{item.email}</div>
      </div>
      <div className="list-item__dept">{item.department}</div>
      <div
        className="list-item__status"
        style={{ color: statusColor, background: statusColor + '18' }}
      >
        {item.status}
      </div>
    </div>
  );
}

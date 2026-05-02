const AVATARS = ['🧑‍💻', '👩‍💻', '🧑‍🔬', '👨‍🎨', '👩‍🏫', '🧑‍🚀', '👨‍🍳', '👩‍🔧'];
const STATUSES = ['Active', 'Inactive', 'Pending', 'Suspended'];
const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Support', 'Finance'];

export const items = Array.from({ length: 12000 }, (_, i) => ({
  id: i + 1,
  name: `User #${String(i + 1).padStart(5, '0')}`,
  email: `user${i + 1}@company.com`,
  department: DEPARTMENTS[i % DEPARTMENTS.length],
  status: STATUSES[i % STATUSES.length],
  avatar: AVATARS[i % AVATARS.length],
  joined: new Date(2015 + Math.floor(i / 1200), i % 12, (i % 28) + 1)
    .toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
}));

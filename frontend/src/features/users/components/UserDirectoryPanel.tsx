import { Panel } from '@/components/ui/Panel';
import type { AuthUser } from '@/types/domain';

type UserDirectoryPanelProps = {
  users: AuthUser[];
  onSelect: (user: AuthUser) => void;
};

export function UserDirectoryPanel({ users, onSelect }: UserDirectoryPanelProps) {
  return (
    <Panel title="User directory">
      <div className="mt-4 space-y-3">
        {users.map((user) => (
          <button
            key={user.id}
            className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 text-left"
            onClick={() => onSelect(user)}
          >
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-slate-500">
                {user.email} · {user.role}
              </div>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

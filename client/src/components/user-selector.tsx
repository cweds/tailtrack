import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@/hooks/use-dog-care";

interface UserSelectorProps {
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  users: readonly User[];
}

export function UserSelector({ selectedUser, onUserSelect, users }: UserSelectorProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        👤 Who's doing the care?
      </label>
      <div className="grid grid-cols-3 gap-2">
        {users.map((user) => (
          <Button
            key={user}
            onClick={() => onUserSelect(user)}
            variant="outline"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200",
              selectedUser === user
                ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
                : "border-gray-200 text-gray-700 hover:border-orange-500 hover:bg-orange-50"
            )}
          >
            {user}
          </Button>
        ))}
      </div>
    </div>
  );
}

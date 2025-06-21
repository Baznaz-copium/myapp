import { useAuth } from "../context/AuthContext";
import { User as UserIcon, Mail, UserCog, Shield, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-lg">No user data found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white/90 rounded-xl shadow-xl border border-gray-200">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <UserIcon className="w-12 h-12 text-blue-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
            {user.active ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-gray-500 mt-1">
            <Mail className="w-4 h-4" />
            <span>{user.email}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-5 rounded-md">
          <div className="flex items-center gap-2 mb-2 text-gray-400 font-semibold">
            <UserCog className="w-4 h-4" />
            Account Info
          </div>
          <div className="flex flex-col gap-1 text-gray-700">
            <div>
              <span className="font-medium">Username:</span> {user.username}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">ID:</span> {user.id}
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-5 rounded-md">
          <div className="flex items-center gap-2 mb-2 text-gray-400 font-semibold">
            <Shield className="w-4 h-4" />
            Role &amp; Status
          </div>
          <div className="flex flex-col gap-1 text-gray-700">
            <div>
              <span className="font-medium">Role:</span>{" "}
              <span className="uppercase">{user.role}</span>
            </div>
            <div>
              <span className="font-medium">Active:</span>{" "}
              <span className={user.active ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {user.active ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Optional: Add more account management features or a button to edit profile */}
    </div>
  );
}
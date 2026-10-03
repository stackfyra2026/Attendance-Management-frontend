import Card from "@/components/ui/Card";
import { Shield, Users, Megaphone } from "lucide-react";
import { Link } from "react-router";

const settingsSections = [
  { title: "Roles & Permissions", desc: "Configure role access and the permission matrix", icon: Shield, to: "/settings/roles" },
  { title: "Permissions", desc: "Browse the full permission catalogue", icon: Shield, to: "/settings/permissions" },
  { title: "Announcements", desc: "Create and manage company announcements", icon: Megaphone, to: "/announcements" },
  { title: "Organization", desc: "Teams and designations", icon: Users, to: "/teams" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-app">Settings</h1>
        <p className="text-sm text-app-muted mt-1">Manage roles, permissions and organisation defaults</p>
      </div>

      <div className="space-y-3">
        {settingsSections.map((section) => (
          <Link key={section.title} to={section.to} className="block">
            <Card padding="md" hover>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <section.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-app">{section.title}</h3>
                  <p className="text-sm text-app-muted">{section.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
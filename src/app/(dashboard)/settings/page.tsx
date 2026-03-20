import Link from 'next/link';
import { Bot, Clock, Mail, Users, Zap, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const settingsCategories = [
  {
    href: '/settings/ai',
    icon: Bot,
    title: 'AI Configuration',
    description: 'Configure AI providers, models, and parameters for intelligent automation',
    iconClassName: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    href: '/settings/sla',
    icon: Clock,
    title: 'SLA Policies',
    description: 'Set response and resolution time policies based on ticket priority',
    iconClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    href: '/settings/channels',
    icon: Mail,
    title: 'Channels',
    description: 'Connect and manage email, chat, and other support channels',
    iconClassName: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    href: '/settings/teams',
    icon: Users,
    title: 'Teams & Users',
    description: 'Manage teams, assign roles, and configure user permissions',
    iconClassName: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  {
    href: '/settings/automation',
    icon: Zap,
    title: 'Automation Rules',
    description: 'Create natural language rules to automate ticket routing and actions',
    iconClassName: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    href: '/settings',
    icon: Settings,
    title: 'General',
    description: 'Application preferences, notifications, and general configuration',
    iconClassName: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your TaskFlow workspace
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {settingsCategories.map((cat) => (
          <Link key={cat.href + cat.title} href={cat.href}>
            <Card className="hover:shadow-md transition-all cursor-pointer h-full group">
              <CardContent className="p-6">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${cat.iconClassName}`}
                >
                  <cat.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors mb-1.5">
                  {cat.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

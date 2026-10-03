import { useState } from "react";
import { classNames } from "@/utils/helpers";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  const [active, setActive] = useState(activeTab || tabs[0]?.id);

  const handleChange = (tabId: string) => {
    setActive(tabId);
    onChange(tabId);
  };

  return (
    <div
      className={classNames(
        "flex overflow-x-auto scrollbar-none border-b border-app/80 gap-1",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleChange(tab.id)}
          className={classNames(
            "flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 relative rounded-t-lg",
            active === tab.id
              ? "text-primary font-bold bg-primary-50/40 dark:bg-primary-950/20"
              : "text-app-muted hover:text-app hover:bg-surface-muted/50"
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={classNames(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-colors",
                active === tab.id
                  ? "bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800"
                  : "bg-surface-muted text-app-muted border-app/50"
              )}
            >
              {tab.count}
            </span>
          )}
          {active === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}

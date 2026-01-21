'use client';

import { cn, translateTag } from '@/lib/utils';
import { CORE_TAGS } from '@/lib/constants';

interface TagFilterProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export default function TagFilter({ selectedTags, onChange, className }: TagFilterProps) {
  const handleToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium text-text-primary mb-3">태그</h3>
      <div className="space-y-1">
        {CORE_TAGS.map((tag) => (
          <label
            key={tag}
            className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-bg-tertiary transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedTags.includes(tag)}
              onChange={() => handleToggle(tag)}
              className="w-4 h-4 rounded border-border bg-bg-tertiary text-accent focus:ring-accent focus:ring-offset-0"
            />
            <span className="text-sm text-text-secondary">{translateTag(tag)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

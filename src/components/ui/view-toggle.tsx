'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from './button';

interface ViewToggleProps {
    view: 'grid' | 'card';
    onViewChange: (view: 'grid' | 'card') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
    return (
        <div className="flex gap-1 border rounded-full p-0.5 bg-muted/50">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewChange('grid')}
                className={`px-2.5 py-1 h-auto rounded-full transition-all ${view === 'grid' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted text-muted-foreground'}`}
                title="Table View"
            >
                <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewChange('card')}
                className={`px-2.5 py-1 h-auto rounded-full transition-all ${view === 'card' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted text-muted-foreground'}`}
                title="Card View"
            >
                <List className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}

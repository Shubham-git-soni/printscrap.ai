'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from './button';

interface ViewToggleProps {
    view: 'grid' | 'card';
    onViewChange: (view: 'grid' | 'card') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
    return (
        <div className="flex gap-1 border rounded-lg p-1 bg-gray-50">
            <Button
                variant={view === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('grid')}
                className={`px-3 ${view === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                title="Table View"
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
                variant={view === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('card')}
                className={`px-3 ${view === 'card' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                title="Card View"
            >
                <List className="h-4 w-4" />
            </Button>
        </div>
    );
}

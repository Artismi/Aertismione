import { useEffect, useRef } from 'react';

interface MenuItem {
    id: string;
    label: string;
    pos: string; // 'left', 'right', 'top-left', etc.
}

interface MenuProps {
    items: MenuItem[];
    onItemClick: (id: string) => void;
    registerButtonPos: (id: string, x: number, y: number) => void;
}

export default function Menu({ items, onItemClick, registerButtonPos }: MenuProps) {
    const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    useEffect(() => {
        const updatePositions = () => {
            requestAnimationFrame(() => {
                items.forEach(item => {
                    const el = btnRefs.current[item.id];
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        let x = rect.left + rect.width / 2;
                        let y = rect.top + rect.height / 2;

                        // Offset the point to the edge facing the center
                        if (item.pos.includes('left')) x = rect.right;
                        if (item.pos.includes('right')) x = rect.left;
                        if (item.pos.includes('top')) y = rect.bottom;
                        if (item.pos.includes('bottom')) y = rect.top;

                        registerButtonPos(item.id, x, y);
                    }
                });
            });
        };

        window.addEventListener('resize', updatePositions);
        updatePositions();

        return () => window.removeEventListener('resize', updatePositions);
    }, [items, registerButtonPos]);

    const getPositionClass = (pos: string) => {
        const classes: Record<string, string> = {
            'top-left': 'top-8 left-8',
            'top-right': 'top-8 right-8',
            'bottom-left': 'bottom-8 left-8',
            'bottom-right': 'bottom-8 right-8',
            'left': 'top-1/2 left-8 -translate-y-1/2',
            'right': 'top-1/2 right-8 -translate-y-1/2',
        };
        return classes[pos] || '';
    };

    return (
        <>
            {items.map(item => (
                <button
                    key={item.id}
                    ref={el => { btnRefs.current[item.id] = el }}
                    onClick={() => onItemClick(item.id)}
                    className={`fixed ${getPositionClass(item.pos)} px-6 py-3 font-mono text-sm uppercase tracking-wide
            bg-black/50 border border-white/30 backdrop-blur-sm
            hover:bg-white/10 hover:border-white/60 hover:scale-105
            transition-all duration-300 cursor-pointer z-20
            shadow-lg hover:shadow-xl hover:shadow-cyan-500/20`}
                    style={{
                        pointerEvents: 'auto',
                    }}
                >
                    <span className="relative z-10">{item.label}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 hover:opacity-100 transition-opacity" />
                </button>
            ))}
        </>
    );
}

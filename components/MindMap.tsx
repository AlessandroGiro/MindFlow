
import React, { useState, useRef, useEffect } from 'react';
import { Project, MindMapNode, MindMapEdge, MindMapNodeType } from '../types/index';
import { generateMindMap } from '../services/geminiService';
import { ProjectHeader } from './Header';
import { 
    MousePointer2, Hand, Locate, 
    Circle, Square, Diamond, MessageSquareText, 
    Trash2, Box, Layers, LogOut, 
    Check, ChevronDown, ChevronRight,
    ArrowRight, ArrowLeft, ArrowLeftRight, Minus, Sparkles
} from 'lucide-react';

interface MindMapProps {
    project: Project;
    projects?: Project[];
    viewMode: 'board' | 'documents' | 'mindmap' | 'mindsnap';
    onViewModeChange: (mode: 'board' | 'documents' | 'mindmap' | 'mindsnap') => void;
    onSelectProject?: (project: Project) => void;
    onToggleSidebar?: () => void;
}

// --- Geometry Math ---

const getShapeIntersection = (node: MindMapNode, targetX: number, targetY: number) => {
    const { x, y, width, height, type } = node;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const dx = targetX - cx;
    const dy = targetY - cy;

    if (type === 'START' || type === 'END') {
        // Ellipse
        const angle = Math.atan2(dy, dx);
        const rx = width / 2;
        const ry = height / 2;
        return {
            x: cx + rx * Math.cos(angle),
            y: cy + ry * Math.sin(angle)
        };
    } else if (type === 'DECISION') {
        // Diamond (Rotated Square)
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return { x: cx, y: cy };
        const w = width / 2;
        const h = height / 2;
        const scale = Math.sqrt(2) / (Math.abs(dx) / w + Math.abs(dy) / h);
        return {
            x: cx + dx * scale,
            y: cy + dy * scale
        };
    } else {
        // Rectangle
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return { x: cx, y: cy };
        const w = width / 2;
        const h = height / 2;
        const t_x = w / Math.abs(dx);
        const t_y = h / Math.abs(dy);
        const t = Math.min(t_x, t_y);
        return {
            x: cx + dx * t,
            y: cy + dy * t
        };
    }
};

const getEdgeControlPoints = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offset = Math.min(dist * 0.5, 100);
    
    let cp1, cp2;
    if (Math.abs(dy) > Math.abs(dx)) {
        cp1 = { x: x1, y: y1 + offset };
        cp2 = { x: x2, y: y2 - offset };
    } else {
        cp1 = { x: x1 + offset, y: y1 };
        cp2 = { x: x2 - offset, y: y2 };
    }
    return { cp1, cp2 };
};

const getBezierPoint = (t: number, p0: {x:number, y:number}, p1: {x:number, y:number}, p2: {x:number, y:number}, p3: {x:number, y:number}) => {
    const cX = 3 * (p1.x - p0.x);
    const bX = 3 * (p2.x - p1.x) - cX;
    const aX = p3.x - p0.x - cX - bX;

    const cY = 3 * (p1.y - p0.y);
    const bY = 3 * (p2.y - p1.y) - cY;
    const aY = p3.y - p0.y - cY - bY;

    const x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
    const y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

    return { x, y };
};

const getBezierAngle = (t: number, p0: {x:number, y:number}, p1: {x:number, y:number}, p2: {x:number, y:number}, p3: {x:number, y:number}) => {
    const mt = 1 - t;
    // Derivative of cubic bezier
    const dx = 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const dy = 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    return Math.atan2(dy, dx) * (180 / Math.PI);
};

// --- Sub Components ---

const NodeEditor: React.FC<{
    node: MindMapNode;
    position: { x: number, y: number };
    onSave: (id: string, label: string, type: MindMapNodeType) => void;
    onCancel: () => void;
    onUngroup: (id: string) => void;
    onDetach: (id: string) => void;
}> = ({ node, position, onSave, onCancel, onUngroup, onDetach }) => {
    const [label, setLabel] = useState(node.label);
    const [type, setType] = useState(node.type);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div 
            className="absolute z-[100] bg-base-100 rounded-xl shadow-2xl border border-base-300 p-3 w-64 animate-fade-in flex flex-col gap-3"
            style={{ left: position.x, top: position.y }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <form onSubmit={(e) => { e.preventDefault(); onSave(node.id, label, type); }} className="flex gap-2">
                <input 
                    ref={inputRef}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="flex-grow bg-base-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Label..."
                />
                <button type="submit" className="bg-brand-primary text-white p-1.5 rounded-lg hover:bg-brand-primary/80">
                    <Check size={16} />
                </button>
            </form>

            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setType('START')} className={`p-2 rounded-lg flex justify-center ${type === 'START' ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-500' : 'bg-base-200 hover:bg-base-300'}`} title="Start/End"><Circle size={16} /></button>
                <button onClick={() => setType('PROCESS')} className={`p-2 rounded-lg flex justify-center ${type === 'PROCESS' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500' : 'bg-base-200 hover:bg-base-300'}`} title="Process"><Square size={16} /></button>
                <button onClick={() => setType('DECISION')} className={`p-2 rounded-lg flex justify-center ${type === 'DECISION' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500' : 'bg-base-200 hover:bg-base-300'}`} title="Decision"><Diamond size={16} /></button>
                <button onClick={() => setType('COMMENT')} className={`p-2 rounded-lg flex justify-center ${type === 'COMMENT' ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500' : 'bg-base-200 hover:bg-base-300'}`} title="Comment"><MessageSquareText size={16} /></button>
            </div>

            <div className="flex flex-col gap-1 pt-2 border-t border-base-200">
                {type === 'GROUP' && (
                    <button type="button" onClick={() => onUngroup(node.id)} className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-left">
                        <Layers size={14} /> Dissolve Frame
                    </button>
                )}
                {node.parentId && (
                    <button type="button" onClick={() => onDetach(node.id)} className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left">
                        <LogOut size={14} /> Remove from Frame
                    </button>
                )}
            </div>
        </div>
    );
};

const EdgeEditor: React.FC<{
    edge: MindMapEdge;
    position: { x: number, y: number };
    onSave: (id: string, label: string, direction: 'none' | 'forward' | 'reverse' | 'bidirectional') => void;
    onDelete: (id: string) => void;
    onCancel: () => void;
}> = ({ edge, position, onSave, onDelete, onCancel }) => {
    const [label, setLabel] = useState(edge.label || '');
    const [direction, setDirection] = useState(edge.direction || 'forward');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div 
            className="absolute z-[100] bg-base-100 rounded-xl shadow-2xl border border-base-300 p-3 w-64 animate-fade-in flex flex-col gap-3"
            style={{ left: position.x, top: position.y }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <form onSubmit={(e) => { e.preventDefault(); onSave(edge.id, label, direction); }} className="flex gap-2">
                <input 
                    ref={inputRef}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="flex-grow bg-base-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Connection label..."
                />
                <button type="submit" className="bg-brand-primary text-white p-1.5 rounded-lg hover:bg-brand-primary/80">
                    <Check size={16} />
                </button>
            </form>

            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setDirection('none')} className={`p-2 rounded-lg flex justify-center ${direction === 'none' ? 'bg-base-300' : 'bg-base-200 hover:bg-base-300'}`} title="None"><Minus size={16} /></button>
                <button onClick={() => setDirection('forward')} className={`p-2 rounded-lg flex justify-center ${direction === 'forward' ? 'bg-base-300' : 'bg-base-200 hover:bg-base-300'}`} title="Forward"><ArrowRight size={16} /></button>
                <button onClick={() => setDirection('reverse')} className={`p-2 rounded-lg flex justify-center ${direction === 'reverse' ? 'bg-base-300' : 'bg-base-200 hover:bg-base-300'}`} title="Reverse"><ArrowLeft size={16} /></button>
                <button onClick={() => setDirection('bidirectional')} className={`p-2 rounded-lg flex justify-center ${direction === 'bidirectional' ? 'bg-base-300' : 'bg-base-200 hover:bg-base-300'}`} title="Bidirectional"><ArrowLeftRight size={16} /></button>
            </div>

            <div className="pt-2 border-t border-base-200">
                <button onClick={() => onDelete(edge.id)} className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} /> Delete Connection
                </button>
            </div>
        </div>
    );
};

// --- Main Component ---

export const MindMap: React.FC<MindMapProps> = ({ project, projects = [], viewMode, onViewModeChange, onSelectProject = () => {}, onToggleSidebar = () => {} }) => {
    const [nodes, setNodes] = useState<MindMapNode[]>([
        { id: 'start', type: 'START', label: 'Start', x: 400, y: 300, width: 120, height: 50 },
        { id: 'n1', type: 'PROCESS', label: 'Research', x: 380, y: 450, width: 160, height: 80 },
    ]);
    const [edges, setEdges] = useState<MindMapEdge[]>([
        { id: 'e1', source: 'start', target: 'n1', direction: 'forward' }
    ]);
    
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
    const [activeTool, setActiveTool] = useState<'select' | 'pan'>('select');
    const [connecting, setConnecting] = useState<{ sourceId: string, startX: number, startY: number, currX: number, currY: number } | null>(null);
    
    // States
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [handlePos, setHandlePos] = useState<{x: number, y: number} | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
    const [selectionBox, setSelectionBox] = useState<{x: number, y: number, w: number, h: number} | null>(null);
    const [dragTargetGroupId, setDragTargetGroupId] = useState<string | null>(null);

    // AI
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{
        mode: 'pan' | 'node' | 'select';
        startX: number;
        startY: number;
        initialTransform: { x: number, y: number, k: number };
        initialNodePositions: Record<string, {x: number, y: number}>;
        initialNodes: MindMapNode[];
    } | null>(null);

    const screenToWorld = (sx: number, sy: number) => {
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: (sx - rect.left - transform.x) / transform.k,
            y: (sy - rect.top - transform.y) / transform.k
        };
    };

    // --- Handlers ---

    const handleWindowMouseMove = (e: MouseEvent) => {
        e.preventDefault();

        if (connecting) {
            const worldPos = screenToWorld(e.clientX, e.clientY);
            setConnecting(prev => prev ? { ...prev, currX: worldPos.x, currY: worldPos.y } : null);
            return;
        }

        const drag = dragRef.current;
        if (!drag) return;

        if (drag.mode === 'pan') {
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            setTransform({
                x: drag.initialTransform.x + dx,
                y: drag.initialTransform.y + dy,
                k: drag.initialTransform.k
            });
        } else if (drag.mode === 'node') {
            const dx = (e.clientX - drag.startX) / drag.initialTransform.k;
            const dy = (e.clientY - drag.startY) / drag.initialTransform.k;
            const worldMouse = screenToWorld(e.clientX, e.clientY);

            // Check for group intersection
            let targetGroup: string | null = null;
            const groupNodes = nodes.filter(n => n.type === 'GROUP' && !n.collapsed);
            for (const group of groupNodes) {
                // Don't target itself if dragging a group
                if (drag.initialNodePositions[group.id]) continue; 
                
                if (worldMouse.x >= group.x && worldMouse.x <= group.x + group.width &&
                    worldMouse.y >= group.y && worldMouse.y <= group.y + group.height) {
                    targetGroup = group.id;
                    break;
                }
            }
            setDragTargetGroupId(targetGroup);

            setNodes(prev => {
                const nextNodes = prev.map(n => {
                    if (drag.initialNodePositions[n.id]) {
                        return {
                            ...n,
                            x: drag.initialNodePositions[n.id].x + dx,
                            y: drag.initialNodePositions[n.id].y + dy
                        };
                    }
                    return n;
                });

                // Recalculate Group Bounds dynamically if children moved
                const affectedGroupIds = new Set<string>();
                nextNodes.forEach(n => {
                    if (drag.initialNodePositions[n.id] && n.parentId) {
                        affectedGroupIds.add(n.parentId);
                    }
                });

                if (affectedGroupIds.size > 0) {
                    return nextNodes.map(n => {
                        if (affectedGroupIds.has(n.id) && !n.collapsed) {
                            const children = nextNodes.filter(c => c.parentId === n.id);
                            if (children.length === 0) return n;
                            
                            const padding = 40; 
                            const minX = Math.min(...children.map(c => c.x));
                            const minY = Math.min(...children.map(c => c.y));
                            const maxX = Math.max(...children.map(c => c.x + c.width));
                            const maxY = Math.max(...children.map(c => c.y + c.height));
                            
                            return {
                                ...n,
                                x: minX - padding,
                                y: minY - padding,
                                width: maxX - minX + (padding * 2),
                                height: maxY - minY + (padding * 2)
                            };
                        }
                        return n;
                    });
                }
                return nextNodes;
            });
        } else if (drag.mode === 'select') {
            const rect = wrapperRef.current?.getBoundingClientRect();
            if (!rect) return;
            const k = drag.initialTransform.k;
            const worldX = (e.clientX - rect.left - drag.initialTransform.x) / k;
            const worldY = (e.clientY - rect.top - drag.initialTransform.y) / k;
            const startWorldX = (drag.startX - rect.left - drag.initialTransform.x) / k;
            const startWorldY = (drag.startY - rect.top - drag.initialTransform.y) / k;

            const x = Math.min(startWorldX, worldX);
            const y = Math.min(startWorldY, worldY);
            const w = Math.abs(worldX - startWorldX);
            const h = Math.abs(worldY - startWorldY);

            setSelectionBox({ x, y, w, h });

            const newSelected = new Set<string>();
            drag.initialNodes.forEach(n => {
                if (n.x < x + w && n.x + n.width > x && n.y < y + h && n.y + n.height > y) {
                    newSelected.add(n.id);
                }
            });
            setSelectedNodes(newSelected);
        }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
        if (connecting) {
            const worldPos = screenToWorld(e.clientX, e.clientY);
            const targetNode = nodes.find(n => 
                worldPos.x >= n.x && worldPos.x <= n.x + n.width &&
                worldPos.y >= n.y && worldPos.y <= n.y + n.height &&
                n.id !== connecting.sourceId && !n.collapsed
            );

            if (targetNode) {
                setEdges(prev => [...prev, {
                    id: `edge-${Date.now()}`,
                    source: connecting.sourceId,
                    target: targetNode.id,
                    direction: 'forward'
                }]);
            }
            setConnecting(null);
            return;
        }

        if (dragRef.current) {
            if (dragRef.current.mode === 'node') {
                // Handle Grouping / Nesting / Detaching
                setNodes(prev => prev.map(n => {
                    // Only affect nodes currently being dragged
                    if (dragRef.current?.initialNodePositions[n.id]) {
                        if (dragTargetGroupId) {
                            // Nesting
                            return { ...n, parentId: dragTargetGroupId };
                        } else {
                            // Detaching (parentId becomes undefined)
                            // Only detach if it was previously parented
                            return { ...n, parentId: undefined }; 
                        }
                    }
                    return n;
                }));
            }
            dragRef.current = null;
            setSelectionBox(null);
            setDragTargetGroupId(null);
        }
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [connecting, nodes, transform, dragTargetGroupId]);

    const handleEdgeUpdate = (id: string, label: string, direction: 'none' | 'forward' | 'reverse' | 'bidirectional') => {
        setEdges(prev => prev.map(e => e.id === id ? { ...e, label, direction } : e));
        setEditingEdgeId(null);
    };

    const handleEdgeDelete = (id: string) => {
        setEdges(prev => prev.filter(e => e.id !== id));
        setEditingEdgeId(null);
    };

    // --- Rendering Helpers ---

    const isNodeVisible = (node: MindMapNode) => {
        if (!node.parentId) return true;
        const parent = nodes.find(n => n.id === node.parentId);
        return parent ? !parent.collapsed : true;
    };

    const getNodeClasses = (node: MindMapNode, isSelected: boolean) => {
        let base = "absolute flex items-center justify-center text-center p-4 font-bold text-sm backdrop-blur-md select-none shadow-sm ";
        
        if (isSelected) {
            base += "ring-2 ring-brand-primary shadow-lg shadow-brand-primary/20 z-50 ";
        } else {
            base += "ring-1 ring-black/5 dark:ring-white/10 hover:ring-brand-primary/30 z-10 ";
        }

        if (node.type === 'GROUP') {
            // Glassmorphism for groups
            let groupStyle = "absolute border-2 border-dashed rounded-2xl pointer-events-auto transition-colors duration-200 ";
            if (dragTargetGroupId === node.id) {
                groupStyle += "border-green-400 bg-green-50/20 shadow-[0_0_40px_rgba(74,222,128,0.3)] ";
            } else if (isSelected) {
                groupStyle += "border-indigo-400 ring-2 ring-indigo-400/30 bg-indigo-50/10 dark:bg-indigo-900/10 backdrop-blur-sm ";
            } else {
                groupStyle += "border-slate-400/40 bg-white/5 dark:bg-black/5 backdrop-blur-sm hover:border-slate-400/80 ";
            }
            return groupStyle + (node.collapsed ? "z-20" : "-z-10");
        }

        switch(node.type) {
            case 'START':
            case 'END':
                return base + "rounded-full bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/80 dark:to-teal-800/80 text-teal-900 dark:text-teal-50 border border-teal-200 dark:border-teal-700";
            case 'PROCESS':
                return base + "rounded-xl bg-white/90 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 text-gray-900 dark:text-white";
            case 'DECISION':
                return base + "transform rotate-45 bg-amber-50/90 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-50 !p-1 rounded-lg aspect-square justify-center items-center";
            case 'COMMENT':
                return base + "bg-yellow-100/90 dark:bg-yellow-900/60 border-l-4 border-yellow-400 text-yellow-900 dark:text-yellow-100 rounded-r-lg rounded-bl-none shadow-md font-normal text-xs text-left items-start";
            default:
                return base;
        }
    };

    // --- Layer Partitioning ---
    const groupNodes = nodes.filter(n => n.type === 'GROUP' && isNodeVisible(n));
    const bottomNodes = nodes.filter(n => n.type !== 'GROUP' && !n.parentId && isNodeVisible(n));
    const topNodes = nodes.filter(n => n.parentId && isNodeVisible(n));

    const renderEdge = (edge: MindMapEdge, layer: 'top' | 'bottom') => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target || !isNodeVisible(source) || !isNodeVisible(target)) return null;

        // Layer check: if both nodes are "top" (grouped), edge is top. Otherwise bottom.
        const isTopEdge = source.parentId && target.parentId;
        if (layer === 'top' && !isTopEdge) return null;
        if (layer === 'bottom' && isTopEdge) return null;

        const start = getShapeIntersection(source, target.x + target.width/2, target.y + target.height/2);
        const end = getShapeIntersection(target, source.x + source.width/2, source.y + source.height/2);
        const { cp1, cp2 } = getEdgeControlPoints(start.x, start.y, end.x, end.y);
        const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
        
        // Calculate midpoint for label positioning and rotation
        const mid = getBezierPoint(0.5, start, cp1, cp2, end);
        const angle = getBezierAngle(0.5, start, cp1, cp2, end);
        
        // Flip if the angle causes text to be upside down (left-facing)
        const isFlipped = Math.abs(angle) > 90;
        const renderAngle = isFlipped ? angle + 180 : angle;

        // Determine which arrows to show based on direction and flip state.
        // If flipped (180 deg rotation), we need to swap arrows visually to point in the correct line direction.
        const showLeftArrow = (!isFlipped && (edge.direction === 'reverse' || edge.direction === 'bidirectional')) ||
                              (isFlipped && (edge.direction === 'forward' || edge.direction === 'bidirectional'));
        
        const showRightArrow = (!isFlipped && (edge.direction === 'forward' || edge.direction === 'bidirectional')) ||
                               (isFlipped && (edge.direction === 'reverse' || edge.direction === 'bidirectional'));

        return (
            <g key={edge.id} className="group">
                {/* Invisible wide stroke for clicking */}
                <path 
                    d={path} 
                    fill="none" 
                    stroke="transparent" 
                    strokeWidth="20" 
                    className="cursor-pointer" 
                    onClick={(e) => { e.stopPropagation(); setEditingEdgeId(edge.id); }}
                />
                {/* Visible stroke - No markers */}
                <path 
                    d={path} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className="text-slate-400 dark:text-slate-500 transition-colors group-hover:text-brand-primary"
                />
                
                {/* Rotated Pill Box Container */}
                {(edge.label || edge.direction !== 'none') && (
                    <foreignObject 
                        x={mid.x} 
                        y={mid.y} 
                        width={1} 
                        height={1} 
                        className="overflow-visible pointer-events-none"
                    >
                        <div 
                            className="absolute flex items-center justify-center gap-1 px-2 py-1 rounded-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer pointer-events-auto hover:border-brand-primary transition-all origin-center whitespace-nowrap"
                            style={{ transform: `translate(-50%, -50%) rotate(${renderAngle}deg)` }}
                            onClick={(e) => { e.stopPropagation(); setEditingEdgeId(edge.id); }}
                        >
                            {showLeftArrow && <ArrowLeft size={10} className="text-slate-500 dark:text-slate-400" />}
                            
                            {edge.label && (
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 select-none">{edge.label}</span>
                            )}
                            
                            {/* If no label, and no direction, we might show a dot, but here we usually have at least one due to logic above */}
                            {!edge.label && edge.direction === 'none' && (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                            )}

                            {showRightArrow && <ArrowRight size={10} className="text-slate-500 dark:text-slate-400" />}
                        </div>
                    </foreignObject>
                )}
            </g>
        );
    };

    const renderNode = (node: MindMapNode) => (
        <div
            key={node.id}
            className={getNodeClasses(node, selectedNodes.has(node.id))}
            onMouseDown={(e) => {
                // Standard node drag
                e.stopPropagation();
                if (activeTool === 'pan' || connecting) return;
                if (e.button !== 0) return;

                const newSelected = new Set<string>(selectedNodes);
                if (e.shiftKey) {
                    if (newSelected.has(node.id)) newSelected.delete(node.id);
                    else newSelected.add(node.id);
                } else {
                    if (!newSelected.has(node.id)) {
                        newSelected.clear();
                        newSelected.add(node.id);
                    }
                }
                setSelectedNodes(newSelected);

                const positions: Record<string, {x: number, y: number}> = {};
                const addNodeAndChildren = (id: string) => {
                    const n = nodes.find(x => x.id === id);
                    if (!n || !isNodeVisible(n)) return;
                    positions[id] = { x: n.x, y: n.y };
                    if (n.type === 'GROUP' && !n.collapsed) {
                        nodes.filter(child => child.parentId === id).forEach(child => {
                            positions[child.id] = { x: child.x, y: child.y };
                        });
                    }
                };
                newSelected.forEach(id => addNodeAndChildren(id));

                dragRef.current = {
                    mode: 'node',
                    startX: e.clientX,
                    startY: e.clientY,
                    initialTransform: { ...transform },
                    initialNodePositions: positions,
                    initialNodes: []
                };
            }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingNodeId(node.id); }}
            onMouseMove={(e) => {
                if (connecting || isAiLoading || node.collapsed) return;
                const worldPos = screenToWorld(e.clientX, e.clientY);
                const intersection = getShapeIntersection(node, worldPos.x, worldPos.y);
                setHoveredNode(node.id);
                setHandlePos(intersection);
            }}
            onMouseLeave={() => setHoveredNode(null)}
            style={{
                left: node.x,
                top: node.y,
                width: node.type === 'GROUP' && node.collapsed ? 200 : node.width,
                height: node.type === 'GROUP' && node.collapsed ? 40 : node.height,
            }}
        >
            {node.type === 'GROUP' && (
                <div 
                    className="absolute -top-8 left-0 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 rounded-t-lg px-3 py-1 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors select-none z-20"
                    onClick={(e) => { e.stopPropagation(); setNodes(prev => prev.map(n => n.id === node.id ? { ...n, collapsed: !n.collapsed } : n)); }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {node.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    {node.label}
                </div>
            )}

            {node.type === 'DECISION' ? (
                <div className="transform -rotate-45 flex items-center justify-center text-center leading-tight w-full h-full px-2 text-xs pointer-events-none">
                    {node.label}
                </div>
            ) : node.type !== 'GROUP' ? (
                <div className="w-full h-full flex items-center justify-center px-2 pointer-events-none">
                    {node.label}
                </div>
            ) : null}
        </div>
    );

    return (
        <div className="relative h-full w-full overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-30 p-4 md:p-6 pointer-events-none no-print">
                <div className="pointer-events-auto">
                    <ProjectHeader 
                        project={project}
                        projects={projects}
                        onSelectProject={onSelectProject}
                        onNewTaskClick={() => {}}
                        onToggleSidebar={onToggleSidebar} 
                        viewMode={viewMode}
                        onViewModeChange={onViewModeChange}
                    />
                </div>
            </div>

            <div 
                ref={wrapperRef}
                className={`flex-grow relative overflow-hidden touch-none select-none ${activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                onWheel={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const zoomFactor = -e.deltaY * 0.001;
                        const newK = Math.min(Math.max(0.1, transform.k * (1 + zoomFactor)), 3);
                        const rect = wrapperRef.current!.getBoundingClientRect();
                        const mouseX = e.clientX - rect.left;
                        const mouseY = e.clientY - rect.top;
                        const worldX = (mouseX - transform.x) / transform.k;
                        const worldY = (mouseY - transform.y) / transform.k;
                        const newX = mouseX - worldX * newK;
                        const newY = mouseY - worldY * newK;
                        setTransform({ x: newX, y: newY, k: newK });
                    } else {
                        setTransform(p => ({ ...p, x: p.x - e.deltaX, y: p.y - e.deltaY }));
                    }
                }}
                onMouseDown={(e) => {
                    if (connecting) return;
                    if (activeTool === 'pan' || e.button === 1 || (e.button === 0 && e.altKey)) {
                        dragRef.current = { mode: 'pan', startX: e.clientX, startY: e.clientY, initialTransform: { ...transform }, initialNodePositions: {}, initialNodes: [] };
                        return;
                    }
                    if (e.button === 0 && activeTool === 'select' && e.target === wrapperRef.current) {
                        if (!e.shiftKey) setSelectedNodes(new Set());
                        setEditingNodeId(null);
                        setEditingEdgeId(null);
                        dragRef.current = { mode: 'select', startX: e.clientX, startY: e.clientY, initialTransform: { ...transform }, initialNodePositions: {}, initialNodes: nodes };
                    }
                }}
            >
                <div 
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
                        backgroundSize: `${24 * transform.k}px ${24 * transform.k}px`,
                        backgroundPosition: `${transform.x}px ${transform.y}px`
                    }}
                />

                <div 
                    className="absolute origin-top-left will-change-transform"
                    style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}
                >
                    {/* SVG Defs */}
                    <svg className="absolute w-0 h-0 overflow-hidden">
                        <defs>
                            {/* Markers removed as per user request for pill style */}
                        </defs>
                    </svg>

                    {/* Layer 0: Bottom Edges */}
                    <svg className="absolute top-0 left-0 overflow-visible w-px h-px pointer-events-none">
                        {edges.map(edge => renderEdge(edge, 'bottom'))}
                    </svg>

                    {/* Layer 1: Bottom Nodes */}
                    {bottomNodes.map(renderNode)}

                    {/* Layer 2: Groups */}
                    {groupNodes.map(renderNode)}

                    {/* Layer 3: Top Edges */}
                    <svg className="absolute top-0 left-0 overflow-visible w-px h-px pointer-events-none">
                        {edges.map(edge => renderEdge(edge, 'top'))}
                        {connecting && (
                            <path 
                                d={`M ${connecting.startX} ${connecting.startY} L ${connecting.currX} ${connecting.currY}`}
                                fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse"
                            />
                        )}
                    </svg>

                    {/* Layer 4: Top Nodes */}
                    {topNodes.map(renderNode)}

                    {/* Smart Connection Handle - Rendered separately to avoid rotation issues */}
                    {!connecting && hoveredNode && handlePos && (() => {
                        const node = nodes.find(n => n.id === hoveredNode);
                        if (!node || node.type === 'GROUP') return null;
                        
                        return (
                            <div 
                                className="absolute w-4 h-4 bg-white border-2 border-brand-primary rounded-full cursor-crosshair z-[60] hover:scale-125 transition-transform shadow-sm"
                                style={{ 
                                    left: handlePos.x - 8,
                                    top: handlePos.y - 8 
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    const worldPos = screenToWorld(e.clientX, e.clientY);
                                    setConnecting({
                                        sourceId: node.id,
                                        startX: handlePos.x,
                                        startY: handlePos.y,
                                        currX: worldPos.x,
                                        currY: worldPos.y
                                    });
                                }}
                            />
                        );
                    })()}

                    {/* Editors */}
                    {editingNodeId && (() => {
                        const node = nodes.find(n => n.id === editingNodeId);
                        if (!node) return null;
                        return (
                            <NodeEditor 
                                node={node}
                                position={{ x: node.x + node.width/2 - 128, y: node.y + node.height + 10 }}
                                onSave={(id, l, t) => { 
                                    setNodes(prev => prev.map(n => {
                                        if (n.id === id) {
                                            let dims = { width: n.width, height: n.height };
                                            if (t === 'START' || t === 'END') dims = { width: 120, height: 50 };
                                            else if (t === 'PROCESS') dims = { width: 160, height: 80 };
                                            else if (t === 'DECISION') dims = { width: 100, height: 100 };
                                            else if (t === 'COMMENT') dims = { width: 150, height: 100 };
                                            return { ...n, label: l, type: t, ...dims };
                                        }
                                        return n;
                                    }));
                                    setEditingNodeId(null);
                                }}
                                onCancel={() => setEditingNodeId(null)}
                                onUngroup={(gid) => {
                                    setNodes(prev => prev.filter(n => n.id !== gid).map(n => n.parentId === gid ? { ...n, parentId: undefined } : n));
                                    setEditingNodeId(null);
                                }}
                                onDetach={(nid) => {
                                    setNodes(prev => prev.map(n => n.id === nid ? { ...n, parentId: undefined } : n));
                                    setEditingNodeId(null);
                                }}
                            />
                        )
                    })()}

                    {editingEdgeId && (() => {
                        const edge = edges.find(e => e.id === editingEdgeId);
                        if (!edge) return null;
                        // Find center of edge to position modal
                        const source = nodes.find(n => n.id === edge.source);
                        const target = nodes.find(n => n.id === edge.target);
                        if(!source || !target) return null;
                        const start = getShapeIntersection(source, target.x + target.width/2, target.y + target.height/2);
                        const end = getShapeIntersection(target, source.x + source.width/2, source.y + source.height/2);
                        const mid = { x: (start.x + end.x)/2, y: (start.y + end.y)/2 }; // Approx center for modal placement

                        return (
                            <EdgeEditor 
                                edge={edge}
                                position={mid}
                                onSave={handleEdgeUpdate}
                                onDelete={handleEdgeDelete}
                                onCancel={() => setEditingEdgeId(null)}
                            />
                        )
                    })()}

                    {/* Selection Box */}
                    {selectionBox && (
                        <div 
                            className="absolute border border-brand-primary bg-brand-primary/10 pointer-events-none z-50"
                            style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }}
                        />
                    )}
                </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
                <div className="flex items-center gap-1.5 bg-white/40 dark:bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl shadow-xl border border-white/50 dark:border-white/10 ring-1 ring-black/5">
                    <div className="flex gap-1 px-2 border-r border-white/20">
                        <button onClick={() => setActiveTool('select')} className={`p-2 rounded-xl ${activeTool === 'select' ? 'bg-white text-brand-primary shadow-sm' : 'hover:bg-white/20'}`}><MousePointer2 size={18} /></button>
                        <button onClick={() => setActiveTool('pan')} className={`p-2 rounded-xl ${activeTool === 'pan' ? 'bg-white text-brand-primary shadow-sm' : 'hover:bg-white/20'}`}><Hand size={18} /></button>
                        <button onClick={() => {
                             if (nodes.length === 0) { setTransform({ x: 0, y: 0, k: 1 }); return; }
                             const minX = Math.min(...nodes.map(n => n.x));
                             const maxX = Math.max(...nodes.map(n => n.x + n.width));
                             const minY = Math.min(...nodes.map(n => n.y));
                             const maxY = Math.max(...nodes.map(n => n.y + n.height));
                             const w = maxX - minX; const h = maxY - minY;
                             const cx = minX + w / 2; const cy = minY + h / 2;
                             const containerW = wrapperRef.current?.clientWidth || 1000;
                             const containerH = wrapperRef.current?.clientHeight || 800;
                             const scaleX = containerW / (w + 200); const scaleY = containerH / (h + 200);
                             const k = Math.min(Math.max(scaleX, scaleY, 0.5), 1.2); 
                             setTransform({ x: containerW / 2 - cx * k, y: containerH / 2 - cy * k, k });
                        }} className="p-2 rounded-xl hover:bg-white/20"><Locate size={18} /></button>
                    </div>
                    <div className="flex gap-1 px-2 border-r border-white/20">
                        <button onClick={() => {
                             // Logic duplicated for brevity - ideally extracted
                             const containerW = wrapperRef.current?.clientWidth || 1000;
                             const containerH = wrapperRef.current?.clientHeight || 800;
                             const center = screenToWorld((wrapperRef.current?.getBoundingClientRect().left||0)+containerW/2, (wrapperRef.current?.getBoundingClientRect().top||0)+containerH/2);
                             const newNode = { id: `node-${Date.now()}`, type: 'START' as MindMapNodeType, label: 'Start', x: center.x-60, y: center.y-25, width: 120, height: 50 };
                             setNodes(p => [...p, newNode]); setSelectedNodes(new Set([newNode.id]));
                        }} className="p-2 rounded-xl hover:bg-white/20 text-teal-600"><Circle size={18} /></button>
                        <button onClick={() => {
                             const containerW = wrapperRef.current?.clientWidth || 1000;
                             const containerH = wrapperRef.current?.clientHeight || 800;
                             const center = screenToWorld((wrapperRef.current?.getBoundingClientRect().left||0)+containerW/2, (wrapperRef.current?.getBoundingClientRect().top||0)+containerH/2);
                             const newNode = { id: `node-${Date.now()}`, type: 'PROCESS' as MindMapNodeType, label: 'Process', x: center.x-80, y: center.y-40, width: 160, height: 80 };
                             setNodes(p => [...p, newNode]); setSelectedNodes(new Set([newNode.id]));
                        }} className="p-2 rounded-xl hover:bg-white/20 text-purple-600"><Square size={18} /></button>
                        <button onClick={() => {
                             const containerW = wrapperRef.current?.clientWidth || 1000;
                             const containerH = wrapperRef.current?.clientHeight || 800;
                             const center = screenToWorld((wrapperRef.current?.getBoundingClientRect().left||0)+containerW/2, (wrapperRef.current?.getBoundingClientRect().top||0)+containerH/2);
                             const newNode = { id: `node-${Date.now()}`, type: 'DECISION' as MindMapNodeType, label: '?', x: center.x-50, y: center.y-50, width: 100, height: 100 };
                             setNodes(p => [...p, newNode]); setSelectedNodes(new Set([newNode.id]));
                        }} className="p-2 rounded-xl hover:bg-white/20 text-amber-600"><Diamond size={18} /></button>
                        <button onClick={() => {
                             const containerW = wrapperRef.current?.clientWidth || 1000;
                             const containerH = wrapperRef.current?.clientHeight || 800;
                             const center = screenToWorld((wrapperRef.current?.getBoundingClientRect().left||0)+containerW/2, (wrapperRef.current?.getBoundingClientRect().top||0)+containerH/2);
                             const newNode = { id: `node-${Date.now()}`, type: 'COMMENT' as MindMapNodeType, label: 'Note...', x: center.x, y: center.y, width: 150, height: 100 };
                             setNodes(p => [...p, newNode]); setSelectedNodes(new Set([newNode.id]));
                        }} className="p-2 rounded-xl hover:bg-white/20 text-yellow-600"><MessageSquareText size={18} /></button>
                    </div>
                    <div className="flex gap-1 px-2">
                        {selectedNodes.size > 1 && (
                            <button onClick={() => {
                                const toGroup = nodes.filter(n => selectedNodes.has(n.id));
                                const minX = Math.min(...toGroup.map(n=>n.x)); const maxX = Math.max(...toGroup.map(n=>n.x+n.width));
                                const minY = Math.min(...toGroup.map(n=>n.y)); const maxY = Math.max(...toGroup.map(n=>n.y+n.height));
                                const gid = `group-${Date.now()}`; const pad=40;
                                setNodes(prev => [...prev.map(n=>selectedNodes.has(n.id)?{...n, parentId: gid}:n), {id: gid, type: 'GROUP', label: 'Group', x: minX-pad, y: minY-pad, width: maxX-minX+pad*2, height: maxY-minY+pad*2}]);
                                setSelectedNodes(new Set([gid]));
                            }} className="p-2 rounded-xl hover:bg-white/20 text-indigo-600 animate-fade-in" title="Group"><Box size={18} /></button>
                        )}
                        <button onClick={() => {
                            if(selectedNodes.size===0) return;
                            setNodes(p=>p.filter(n=>!selectedNodes.has(n.id)));
                            setEdges(p=>p.filter(e=>!selectedNodes.has(e.source)&&!selectedNodes.has(e.target)));
                            setSelectedNodes(new Set()); setEditingNodeId(null);
                        }} className="p-2 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-500"><Trash2 size={18} /></button>
                    </div>
                </div>
            </div>

            {/* AI Toggle */}
            <div className="absolute bottom-8 right-8 z-40">
                <button onClick={() => setAiPanelOpen(!aiPanelOpen)} className="bg-white/60 dark:bg-black/60 backdrop-blur-xl font-bold py-3 px-5 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition-transform border border-white/20">
                    <Sparkles size={18} className="text-brand-primary" /> <span>AI Designer</span>
                </button>
            </div>

            {/* AI Panel */}
            {aiPanelOpen && (
                <div className="absolute bottom-24 right-8 w-80 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-5 z-50 animate-fade-in">
                    <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe your workflow..."
                        className="w-full h-24 bg-white/50 dark:bg-black/50 border border-white/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none mb-3"
                    />
                    <button onClick={async () => {
                        if(!aiPrompt.trim()) return; setIsAiLoading(true);
                        try {
                            const res = await generateMindMap(aiPrompt);
                            const minX = Math.min(...res.nodes.map(n=>n.x)); const minY = Math.min(...res.nodes.map(n=>n.y));
                            const center = screenToWorld((wrapperRef.current?.getBoundingClientRect().left||0)+500, (wrapperRef.current?.getBoundingClientRect().top||0)+400);
                            const offX = center.x - minX; const offY = center.y - minY;
                            setNodes(p => [...p, ...res.nodes.map(n=>({...n, x: n.x+offX, y: n.y+offY}))]);
                            setEdges(p => [...p, ...res.edges]);
                            setAiPrompt(''); setAiPanelOpen(false);
                        } catch(e) { alert('Error generating.'); } finally { setIsAiLoading(false); }
                    }} disabled={isAiLoading} className="w-full bg-brand-primary text-white font-bold py-2 rounded-xl shadow-md hover:bg-brand-primary/90 disabled:opacity-50 text-sm">
                        {isAiLoading ? 'Generating...' : 'Generate Mind Map'}
                    </button>
                </div>
            )}
        </div>
    );
};

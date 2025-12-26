import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Settings,
  GripVertical,
  X,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Wallet,
  TrendingUp,
  Globe,
  Activity,
  BarChart3,
  Star,
  History,
  Newspaper,
  Bell,
  LineChart,
  PieChart,
  Zap,
} from 'lucide-react';
import {
  getDashboardLayout,
  saveDashboardLayout,
  addWidget,
  removeWidget,
  updateWidgetPosition,
  toggleWidgetVisibility,
  resetToDefaultLayout,
  getWidgetsByCategory,
  WIDGET_DEFINITIONS,
  type DashboardLayout,
  type WidgetConfig,
  type WidgetType,
  type WidgetPosition,
} from '../services/dashboardWidgets';

interface CustomDashboardProps {
  userId: string;
}

const GRID_COLS = 12;
const ROW_HEIGHT = 80;
const GAP = 16;

// Icon mapping for widgets
const WIDGET_ICONS: Record<string, React.ReactNode> = {
  Wallet: <Wallet className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Globe: <Globe className="h-5 w-5" />,
  Activity: <Activity className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  History: <History className="h-5 w-5" />,
  Newspaper: <Newspaper className="h-5 w-5" />,
  Bell: <Bell className="h-5 w-5" />,
  LineChart: <LineChart className="h-5 w-5" />,
  PieChart: <PieChart className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
};

export function CustomDashboard({ userId }: CustomDashboardProps) {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  const loadLayout = async () => {
    setIsLoading(true);
    const result = await getDashboardLayout(userId);
    if (result.layout) {
      setLayout(result.layout);
    }
    setIsLoading(false);
  };

  // Load layout on mount
  useEffect(() => {
    loadLayout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSave = async () => {
    if (!layout) return;
    setIsSaving(true);
    await saveDashboardLayout(layout);
    setHasChanges(false);
    setIsSaving(false);
  };

  const handleAddWidget = (type: WidgetType) => {
    if (!layout) return;
    const newLayout = addWidget(layout, type);
    setLayout(newLayout);
    setHasChanges(true);
    setShowWidgetPicker(false);
  };

  const handleRemoveWidget = (widgetId: string) => {
    if (!layout) return;
    const newLayout = removeWidget(layout, widgetId);
    setLayout(newLayout);
    setHasChanges(true);
  };

  const handleToggleVisibility = (widgetId: string) => {
    if (!layout) return;
    const newLayout = toggleWidgetVisibility(layout, widgetId);
    setLayout(newLayout);
    setHasChanges(true);
  };

  const handleReset = () => {
    if (!confirm('Reset dashboard to default layout? This will remove all customizations.')) {
      return;
    }
    const defaultLayout = resetToDefaultLayout(userId);
    setLayout(defaultLayout);
    setHasChanges(true);
  };

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, widgetId: string) => {
      if (!isEditMode || !gridRef.current) return;

      const widget = layout?.widgets.find((w) => w.id === widgetId);
      if (!widget) return;

      const gridRect = gridRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const cellWidth = (gridRect.width - (GRID_COLS - 1) * GAP) / GRID_COLS;
      const widgetLeft = widget.position.x * (cellWidth + GAP);
      const widgetTop = widget.position.y * (ROW_HEIGHT + GAP);

      setDragOffset({
        x: clientX - gridRect.left - widgetLeft,
        y: clientY - gridRect.top - widgetTop,
      });
      setDraggedWidget(widgetId);
    },
    [isEditMode, layout]
  );

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!draggedWidget || !layout || !gridRef.current) return;

      const gridRect = gridRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const cellWidth = (gridRect.width - (GRID_COLS - 1) * GAP) / GRID_COLS;

      const newX = Math.round((clientX - gridRect.left - dragOffset.x) / (cellWidth + GAP));
      const newY = Math.round((clientY - gridRect.top - dragOffset.y) / (ROW_HEIGHT + GAP));

      const widget = layout.widgets.find((w) => w.id === draggedWidget);
      if (!widget) return;

      const clampedX = Math.max(0, Math.min(GRID_COLS - widget.position.w, newX));
      const clampedY = Math.max(0, newY);

      if (clampedX !== widget.position.x || clampedY !== widget.position.y) {
        const newPosition: WidgetPosition = {
          ...widget.position,
          x: clampedX,
          y: clampedY,
        };
        const newLayout = updateWidgetPosition(layout, draggedWidget, newPosition);
        setLayout(newLayout);
        setHasChanges(true);
      }
    },
    [draggedWidget, layout, dragOffset]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
  }, []);

  // Add drag event listeners
  useEffect(() => {
    if (draggedWidget) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [draggedWidget, handleDragMove, handleDragEnd]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Failed to load dashboard</p>
        <button
          onClick={loadLayout}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const visibleWidgets = layout.widgets.filter((w) => w.isVisible);
  const gridHeight =
    Math.max(...visibleWidgets.map((w) => w.position.y + w.position.h), 1) *
      (ROW_HEIGHT + GAP) +
    GAP;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">{layout.name}</h2>
          {hasChanges && (
            <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
              Unsaved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <button
                onClick={() => setShowWidgetPicker(true)}
                className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Widget
              </button>
              <button
                onClick={handleReset}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Reset to default"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </>
          )}
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isEditMode
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4" />
            {isEditMode ? 'Done' : 'Customize'}
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <div
        ref={gridRef}
        className="relative"
        style={{ height: gridHeight, minHeight: 400 }}
      >
        {/* Grid Background (edit mode only) */}
        {isEditMode && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(100, 116, 139, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(100, 116, 139, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: `calc((100% - ${(GRID_COLS - 1) * GAP}px) / ${GRID_COLS} + ${GAP}px) ${ROW_HEIGHT + GAP}px`,
            }}
          />
        )}

        {/* Widgets */}
        {visibleWidgets.map((widget) => (
          <WidgetContainer
            key={widget.id}
            widget={widget}
            isEditMode={isEditMode}
            isDragging={draggedWidget === widget.id}
            onDragStart={(e) => handleDragStart(e, widget.id)}
            onRemove={() => handleRemoveWidget(widget.id)}
            onToggleVisibility={() => handleToggleVisibility(widget.id)}
            gridCols={GRID_COLS}
            rowHeight={ROW_HEIGHT}
            gap={GAP}
          />
        ))}
      </div>

      {/* Hidden Widgets List (edit mode) */}
      {isEditMode && layout.widgets.some((w) => !w.isVisible) && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Hidden Widgets</h3>
          <div className="flex flex-wrap gap-2">
            {layout.widgets
              .filter((w) => !w.isVisible)
              .map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => handleToggleVisibility(widget.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:text-white transition-colors"
                >
                  {WIDGET_ICONS[WIDGET_DEFINITIONS[widget.type].icon]}
                  <span className="text-sm">{widget.title}</span>
                  <Eye className="h-4 w-4 text-slate-500" />
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <WidgetPicker
          onSelect={handleAddWidget}
          onClose={() => setShowWidgetPicker(false)}
          existingWidgets={layout.widgets.map((w) => w.type)}
        />
      )}
    </div>
  );
}

// Widget Container Component
interface WidgetContainerProps {
  widget: WidgetConfig;
  isEditMode: boolean;
  isDragging: boolean;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onRemove: () => void;
  onToggleVisibility: () => void;
  gridCols: number;
  rowHeight: number;
  gap: number;
}

function WidgetContainer({
  widget,
  isEditMode,
  isDragging,
  onDragStart,
  onRemove,
  onToggleVisibility,
  gridCols,
  rowHeight,
  gap,
}: WidgetContainerProps) {
  const definition = WIDGET_DEFINITIONS[widget.type];

  // Calculate position and size
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `calc(${widget.position.x} * ((100% - ${(gridCols - 1) * gap}px) / ${gridCols} + ${gap}px))`,
    top: widget.position.y * (rowHeight + gap),
    width: `calc(${widget.position.w} * ((100% - ${(gridCols - 1) * gap}px) / ${gridCols}) + ${(widget.position.w - 1) * gap}px)`,
    height: widget.position.h * rowHeight + (widget.position.h - 1) * gap,
    transition: isDragging ? 'none' : 'all 0.2s ease',
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      style={style}
      className={`bg-slate-900 border rounded-xl overflow-hidden ${
        isEditMode
          ? isDragging
            ? 'border-orange-500 shadow-lg shadow-orange-500/20'
            : 'border-slate-600 hover:border-slate-500'
          : 'border-slate-700'
      }`}
    >
      {/* Widget Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b border-slate-700 ${
          isEditMode ? 'cursor-move' : ''
        }`}
        onMouseDown={isEditMode ? onDragStart : undefined}
        onTouchStart={isEditMode ? onDragStart : undefined}
      >
        <div className="flex items-center gap-2">
          {isEditMode && <GripVertical className="h-4 w-4 text-slate-500" />}
          <div className="text-slate-400">{WIDGET_ICONS[definition.icon]}</div>
          <span className="font-medium text-white text-sm">{widget.title}</span>
        </div>

        {isEditMode && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility();
              }}
              className="p-1 text-slate-500 hover:text-white transition-colors"
              title="Hide widget"
            >
              <EyeOff className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
              title="Remove widget"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Widget Content */}
      <div className="p-4 h-[calc(100%-44px)] overflow-auto">
        <WidgetContent widget={widget} />
      </div>
    </div>
  );
}

// Widget Content Component
function WidgetContent({ widget }: { widget: WidgetConfig }) {
  // Render different content based on widget type
  switch (widget.type) {
    case 'portfolio_summary':
      return (
        <div className="space-y-3">
          <div>
            <div className="text-slate-400 text-sm">Total Value</div>
            <div className="text-2xl font-bold text-white">$24,567.89</div>
          </div>
          <div className="flex gap-4">
            <div>
              <div className="text-slate-400 text-xs">24h Change</div>
              <div className="text-green-400 font-medium">+$456.78 (+1.89%)</div>
            </div>
          </div>
        </div>
      );

    case 'price_ticker':
      return (
        <div className="flex items-center gap-6 overflow-x-auto">
          {[
            { name: 'BTC', price: '$43,567', change: '+2.4%', up: true },
            { name: 'ETH', price: '$2,345', change: '+1.8%', up: true },
            { name: 'SOL', price: '$98.45', change: '-0.5%', up: false },
          ].map((coin) => (
            <div key={coin.name} className="flex items-center gap-2 flex-shrink-0">
              <span className="font-medium text-white">{coin.name}</span>
              <span className="text-slate-300">{coin.price}</span>
              <span className={coin.up ? 'text-green-400' : 'text-red-400'}>{coin.change}</span>
            </div>
          ))}
        </div>
      );

    case 'fear_greed_index':
      return (
        <div className="text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-2">65</div>
          <div className="text-sm text-slate-400">Greed</div>
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-[65%]" />
          </div>
        </div>
      );

    case 'top_movers':
      return (
        <div className="space-y-2">
          {[
            { name: 'PEPE', change: '+45.2%', up: true },
            { name: 'BONK', change: '+23.1%', up: true },
            { name: 'WIF', change: '-12.3%', up: false },
          ].map((coin) => (
            <div key={coin.name} className="flex items-center justify-between">
              <span className="text-white">{coin.name}</span>
              <span className={coin.up ? 'text-green-400' : 'text-red-400'}>{coin.change}</span>
            </div>
          ))}
        </div>
      );

    case 'quick_actions':
      return (
        <div className="grid grid-cols-2 gap-2">
          {['Add Trade', 'Set Alert', 'View Reports', 'Settings'].map((action) => (
            <button
              key={action}
              className="p-2 bg-slate-800 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full text-slate-500">
          <span className="text-sm">{WIDGET_DEFINITIONS[widget.type].name} content</span>
        </div>
      );
  }
}

// Widget Picker Modal
interface WidgetPickerProps {
  onSelect: (type: WidgetType) => void;
  onClose: () => void;
  existingWidgets: WidgetType[];
}

function WidgetPicker({ onSelect, onClose, existingWidgets }: WidgetPickerProps) {
  const categories = getWidgetsByCategory();

  const categoryLabels: Record<string, string> = {
    portfolio: 'Portfolio',
    market: 'Market',
    tools: 'Tools',
    news: 'News',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Add Widget</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {Object.entries(categories).map(([category, widgets]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-slate-400 uppercase mb-3">
                {categoryLabels[category]}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {widgets.map((widget) => {
                  const isAdded = existingWidgets.includes(widget.type);

                  return (
                    <button
                      key={widget.type}
                      onClick={() => onSelect(widget.type)}
                      disabled={isAdded}
                      className={`p-4 rounded-xl text-left transition-all ${
                        isAdded
                          ? 'bg-slate-800/50 opacity-50 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-700 hover:border-orange-500/50'
                      } border border-slate-700`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-orange-400">{WIDGET_ICONS[widget.icon]}</div>
                        <span className="font-medium text-white">{widget.name}</span>
                        {isAdded && (
                          <span className="text-xs text-slate-500 ml-auto">Added</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{widget.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

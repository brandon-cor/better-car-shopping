"use client";

import { 
  Gauge, 
  Fuel, 
  Settings, 
  Car, 
  Zap, 
  Droplet,
  Ruler,
  Weight,
  Users,
  Cog,
  Factory,
  Shield,
  Palette,
  Armchair,
  Hash,
  Package
} from "lucide-react";
import { DetailedListing } from "@/lib/schema";

interface VehicleSpecsProps {
  listing: DetailedListing;
}

interface SpecItemProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number | undefined | null;
  highlight?: boolean;
  colorSwatch?: string;
}

function SpecItem({ icon, label, value, highlight, colorSwatch }: SpecItemProps) {
  if (value === undefined || value === null || value === '') return null;
  
  // Simple heuristic to get a valid hex/css color from name
  const getDisplayColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('white')) return '#ffffff';
    if (n.includes('black')) return '#000000';
    if (n.includes('silver')) return '#c0c0c0';
    if (n.includes('gray') || n.includes('grey')) return '#808080';
    if (n.includes('red')) return '#ef4444';
    if (n.includes('blue')) return '#3b82f6';
    if (n.includes('green')) return '#22c55e';
    if (n.includes('yellow')) return '#eab308';
    if (n.includes('orange')) return '#f97316';
    if (n.includes('brown')) return '#78350f';
    if (n.includes('beige') || n.includes('tan')) return '#d2b48c';
    return null;
  };

  const swatchColor = colorSwatch ? getDisplayColor(colorSwatch) : null;
  
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-border/5 last:border-0 group transition-all duration-200`}>
      <div className="flex items-center gap-2.5 text-muted-foreground">
        {icon && (
          <div className="text-muted-foreground/60 group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {swatchColor && (
          <div 
            className="w-3 h-3 rounded-full border border-border/50 shadow-sm shrink-0" 
            style={{ backgroundColor: swatchColor }}
          />
        )}
        <span className={`text-sm font-bold ${highlight ? 'text-primary' : 'text-foreground/90'}`}>{value}</span>
      </div>
    </div>
  );
}

function SpecGroup({ children }: { children: React.ReactNode }) {
  // Filter out null children
  const validChildren = Array.isArray(children) 
    ? children.filter(Boolean) 
    : children ? [children] : [];
  
  if (validChildren.length === 0) return null;
  
  return (
    <div className="rounded-2xl p-4 border border-border/10 shadow-sm">
      <div className="space-y-0">
        {children}
      </div>
    </div>
  );
}

export function VehicleSpecs({ listing }: VehicleSpecsProps) {
  const build = listing.build;
  
  // Format dimension with unit
  const formatDimension = (val: string | number | undefined, unit: string = 'in') => {
    if (!val) return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return undefined;
    return `${num.toFixed(1)} ${unit}`;
  };
  
  // Format MPG
  const formatMPG = () => {
    const city = build?.city_mpg;
    const hwy = build?.highway_mpg;
    if (city && hwy) return `${city}/${hwy}`;
    if (city) return `${city} City`;
    if (hwy) return `${hwy} Hwy`;
    return undefined;
  };

  // Format Engine Size/Cylinders
  const formatEngineInfo = () => {
    const size = build?.engine_size ? `${build.engine_size}L` : '';
    const cyl = build?.cylinders ? `${build.cylinders} Cyl` : '';
    return [size, cyl].filter(Boolean).join(' ') || "N/A";
  };
  
  const highlights = [
    { label: "Odometer", value: listing.miles ? `${listing.miles.toLocaleString()} mi` : "N/A", icon: <Gauge className="w-4 h-4" /> },
    { label: "Horsepower", value: build?.horsepower ? `${build.horsepower} hp` : "N/A", icon: <Zap className="w-4 h-4" /> },
    { label: "Engine", value: listing.engine || build?.engine || "N/A", icon: <Cog className="w-4 h-4" /> },
    { label: "Transmission", value: listing.transmission || build?.transmission || "N/A", icon: <Settings className="w-4 h-4" /> },
    { label: "Drivetrain", value: listing.drivetrain || build?.drivetrain || "N/A", icon: <Shield className="w-4 h-4" /> },
    { label: "Fuel Economy", value: formatMPG() ? `${formatMPG()} MPG` : "N/A", icon: <Fuel className="w-4 h-4" /> },
    { label: "Seating", value: build?.std_seating ? `${build.std_seating} Seats` : "N/A", icon: <Users className="w-4 h-4" /> },
    { label: "Body Style", value: listing.body_type || build?.body_type || "N/A", icon: <Car className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Key Specifications</h2>
      </div>

      {/* Top Highlights Grid - 2 Rows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 px-1">
        {highlights.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 group">
            <div className="text-primary group-hover:scale-110 transition-all duration-300 shrink-0">
              {item.icon}
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground truncate leading-none">
                {item.label}
              </p>
              <p className="text-xs font-bold text-foreground truncate">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground px-1">All Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Card */}
          <SpecGroup>
            <SpecItem label="Exterior Color" value={listing.exterior_color || listing.base_ext_color} icon={<Palette className="w-3.5 h-3.5" />} colorSwatch={listing.exterior_color || listing.base_ext_color} />
            <SpecItem label="Interior Color" value={listing.interior_color || listing.base_int_color} icon={<Armchair className="w-3.5 h-3.5" />} colorSwatch={listing.interior_color || listing.base_int_color} />
            <SpecItem label="Fuel Type" value={listing.fuel_type || build?.fuel_type} icon={<Droplet className="w-3.5 h-3.5" />} />
            <SpecItem label="Engine Config" value={formatEngineInfo()} icon={<Cog className="w-3.5 h-3.5" />} />
            <SpecItem label="Torque" value={build?.torque ? `${build.torque} lb-ft` : undefined} icon={<Zap className="w-3.5 h-3.5" />} />
            <SpecItem label="Overall Length" value={formatDimension(build?.overall_length)} icon={<Ruler className="w-3.5 h-3.5" />} />
            <SpecItem label="Overall Width" value={formatDimension(build?.overall_width)} icon={<Ruler className="w-3.5 h-3.5" />} />
            <SpecItem label="Overall Height" value={formatDimension(build?.overall_height)} icon={<Ruler className="w-3.5 h-3.5" />} />
          </SpecGroup>

          {/* Right Card */}
          <SpecGroup>
            <SpecItem label="Wheelbase" value={formatDimension(build?.wheelbase)} icon={<Ruler className="w-3.5 h-3.5" />} />
            <SpecItem label="Curb Weight" value={build?.curb_weight ? `${build.curb_weight.toLocaleString()} lbs` : undefined} icon={<Weight className="w-3.5 h-3.5" />} highlight />
            <SpecItem label="Towing Capacity" value={build?.towing_capacity ? `${build.towing_capacity.toLocaleString()} lbs` : undefined} icon={<Shield className="w-3.5 h-3.5" />} />
            <SpecItem label="Fuel Tank" value={build?.fuel_tank_capacity ? `${build.fuel_tank_capacity} gal` : undefined} icon={<Droplet className="w-3.5 h-3.5" />} />
            <SpecItem label="Cargo Capacity" value={build?.cargo_capacity ? `${build.cargo_capacity} cu ft` : undefined} icon={<Package className="w-3.5 h-3.5" />} />
            <SpecItem label="Stock Number" value={listing.stock_no} icon={<Hash className="w-3.5 h-3.5" />} />
            <SpecItem label="Country of Origin" value={build?.made_in} icon={<Factory className="w-3.5 h-3.5" />} />
            <SpecItem label="Model Series" value={build?.version} icon={<Hash className="w-3.5 h-3.5" />} />
          </SpecGroup>
        </div>
      </div>
    </div>
  );
}

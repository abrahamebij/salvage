import React from "react";
import type { TemplateId, Provenance } from "../../types";
import { TEMPLATE_DEFINITIONS } from "../../domain/templates";
import { Sliders, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";

interface ParameterPanelProps {
  selectedTemplate: Exclude<TemplateId, "none">;
  onSelectTemplate: (template: Exclude<TemplateId, "none">) => void;
  parameters: Record<string, number>;
  provenances: Record<string, Provenance>;
  onParameterChange: (paramId: string, value: number) => void;
  onResetDefaults: () => void;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  selectedTemplate,
  onSelectTemplate,
  parameters,
  provenances,
  onParameterChange,
  onResetDefaults,
}) => {
  const currentTemplate = TEMPLATE_DEFINITIONS[selectedTemplate];

  const getProvenanceBadge = (prov: Provenance, isCritical: boolean) => {
    switch (prov) {
      case "measured":
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Measured</span>
          </span>
        );
      case "estimated":
        return (
          <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
            isCritical
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "bg-[#212329] text-[#9ea3b0] border border-[#2b2e37]"
          }`}>
            {isCritical && <AlertCircle className="w-2.5 h-2.5 text-amber-400" />}
            <span>Estimated</span>
          </span>
        );
      case "default":
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#212329] text-[#6b7280] border border-[#2b2e37]">
            <span>Default</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#18191e] border-r border-[#2b2e37] min-h-0 select-none">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-[#2b2e37] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#f4f4f6]">
              Parametric Dimensions
            </h2>
          </div>
          <button
            type="button"
            onClick={onResetDefaults}
            title="Reset parameters to template defaults"
            className="p-1 rounded text-[#9ea3b0] hover:text-[#f4f4f6] hover:bg-[#212329] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Template Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#121316] p-1 rounded-md border border-[#2b2e37]">
          {(["knob", "clip", "bracket"] as const).map((tId) => (
            <button
              key={tId}
              type="button"
              onClick={() => onSelectTemplate(tId)}
              className={`py-1 text-xs font-medium rounded transition-all capitalize ${
                selectedTemplate === tId
                  ? "bg-[#212329] text-amber-400 font-semibold border border-amber-500/30 shadow-xs"
                  : "text-[#9ea3b0] hover:text-[#f4f4f6]"
              }`}
            >
              {tId}
            </button>
          ))}
        </div>
      </div>

      {/* Parameter Controls List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentTemplate.parameters.map((param) => {
          const val = parameters[param.id] ?? param.defaultValue;
          const prov = provenances[param.id] ?? "default";
          const step = param.step ?? 0.5;

          return (
            <div
              key={param.id}
              className="p-3 rounded-lg bg-[#141519] border border-[#23252c] space-y-2 hover:border-[#333742] transition-colors"
            >
              {/* Parameter Title & Provenance Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-medium text-[#f4f4f6]">
                      {param.name}
                    </span>
                    {param.isMatingCritical && (
                      <span
                        title="Mating-critical feature (shaft bore, snap catch, mounting holes)"
                        className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 font-mono"
                      >
                        Mating
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#6b7280] line-clamp-1 mt-0.5" title={param.description}>
                    {param.description}
                  </p>
                </div>

                {getProvenanceBadge(prov, param.isMatingCritical)}
              </div>

              {/* Slider & Numeric Input */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={step}
                  value={val}
                  onChange={(e) =>
                    onParameterChange(param.id, parseFloat(e.target.value))
                  }
                  className="flex-1 accent-amber-500 bg-[#212329] h-1.5 rounded-lg appearance-none cursor-pointer"
                />

                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={param.min}
                    max={param.max}
                    step={step}
                    value={val}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) onParameterChange(param.id, num);
                    }}
                    className="w-18 px-2 py-1 bg-[#1c1e24] text-right font-mono text-xs text-[#f4f4f6] rounded border border-[#2b2e37] focus:outline-none focus:border-amber-500"
                  />
                  {param.unit && (
                    <span className="ml-1 text-[10px] font-mono text-[#9ea3b0]">
                      {param.unit}
                    </span>
                  )}
                </div>
              </div>

              {/* Min/Max bounds range indicator */}
              <div className="flex justify-between text-[9px] font-mono text-[#6b7280]">
                <span>min: {param.min}{param.unit}</span>
                <span>max: {param.max}{param.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

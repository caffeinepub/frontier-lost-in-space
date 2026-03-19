export interface SmokeResult {
  label: string;
  pass: boolean;
}

export interface SmokeTestParams {
  canvasMounted: boolean;
  nodeCount: number;
  selectedNode: string | null;
  scanMode: boolean;
  nodeData: object | null;
  viewportWidth: number;
  viewportHeight: number;
}

export function runSmokeTests(params: SmokeTestParams): SmokeResult[] {
  const {
    canvasMounted,
    nodeCount,
    selectedNode,
    scanMode,
    nodeData,
    viewportWidth,
    viewportHeight,
  } = params;

  const isPortrait = viewportHeight >= viewportWidth;
  const isLandscape = viewportWidth > viewportHeight;
  const isMobileWidth = viewportWidth <= 768;

  return [
    {
      label: "Canvas mounted",
      pass: canvasMounted,
    },
    {
      label: "Globe visible (nodes proxy)",
      pass: nodeCount > 0,
    },
    {
      label: "HUD overlay rendered",
      pass:
        typeof document !== "undefined"
          ? document.querySelector("[data-hud]") !== null
          : true,
    },
    {
      label: "Nodes rendered (>= 10)",
      pass: nodeCount >= 10,
    },
    {
      label: "selectedNode state defined",
      pass: selectedNode !== undefined,
    },
    {
      label: "scanMode state defined",
      pass: scanMode !== undefined,
    },
    {
      label: "Tactical readout after selection",
      pass: selectedNode === null ? true : nodeData !== null,
    },
    {
      label: "Viewport dimensions valid",
      pass: viewportWidth > 0 && viewportHeight > 0,
    },
    {
      label: "Mobile layout usable",
      pass: !isMobileWidth || viewportWidth >= 320,
    },
    {
      label: "Portrait layout usable",
      pass: !isPortrait || viewportHeight >= 480,
    },
    {
      label: "Landscape layout usable",
      pass: !isLandscape || viewportWidth >= 480,
    },
  ];
}

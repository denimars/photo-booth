import type { Filter, FilterName } from "$lib/types";

export const filters: Record<FilterName, Filter> = {
  none: {
    name: "none",
    label: "Original",
    css: "none",
  },
  grayscale: {
    name: "grayscale",
    label: "B&W",
    css: "grayscale(100%)",
  },
  sepia: {
    name: "sepia",
    label: "Vintage",
    css: "sepia(80%)",
  },
  vivid: {
    name: "vivid",
    label: "Vivid",
    css: "saturate(150%) contrast(110%)",
  },
  cool: {
    name: "cool",
    label: "Cool",
    css: "saturate(90%) hue-rotate(180deg) brightness(105%)",
  },
  warm: {
    name: "warm",
    label: "Warm",
    css: "saturate(120%) sepia(20%) brightness(105%)",
  },
  noir: {
    name: "noir",
    label: "Noir",
    css: "grayscale(100%) contrast(140%) brightness(90%)",
  },
};

export const filterList = Object.values(filters);

export function getFilterCss(name: FilterName): string {
  return filters[name]?.css ?? "none";
}

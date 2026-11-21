export const MENU_CATEGORIES = [
  { value: "juice", label: "Nước ép" },
  { value: "coffee", label: "Cà phê" },
  { value: "smoothie", label: "Sinh tố" },
  { value: "milk-tea", label: "Trà sữa" },
];

export function getMenuCategoryLabel(value) {
  return MENU_CATEGORIES.find((category) => category.value === value)?.label ?? "";
}

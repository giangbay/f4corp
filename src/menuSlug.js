export function slugifyMenuName(name) {
  return name
    .toLowerCase()
    .replaceAll("đ", "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getMenuItemPath(item) {
  return `/menu/${slugifyMenuName(item.name)}-${item.id}`;
}

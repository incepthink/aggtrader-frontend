export type TabOption = {
  value: number;
  label: string;
  slug: string;
};

export const VAULT_TABS: TabOption[] = [
  { value: 0, label: "About", slug: "about" },
  { value: 1, label: "Strategies", slug: "strategies" },
  { value: 2, label: "Info", slug: "info" },
  { value: 3, label: "Risk", slug: "risk" },
];
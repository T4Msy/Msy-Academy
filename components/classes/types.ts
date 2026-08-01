export type ClassRole = "aluno" | "professor";

export type ClassModuleOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

export type ClassTabItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
};

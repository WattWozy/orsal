export function localDateValue(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function formatDate(value: string): string {
  if (!value) return "Pendiente";

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
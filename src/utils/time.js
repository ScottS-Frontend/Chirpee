export function formatTime(msOrDate) {
  const d = msOrDate?.toDate ? msOrDate.toDate() : new Date(msOrDate);
  return d.toLocaleString();
}
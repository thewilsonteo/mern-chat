export function formatMessageTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

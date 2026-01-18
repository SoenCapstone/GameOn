export const formatFullName = (first?: string | null, last?: string | null) => {
  const full = `${first ?? ""} ${last ?? ""}`.trim();
  return full || "Unknown Player";
};

export const getInitials = (name: string, email?: string | null) => {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? "?";
  }
  return email?.[0]?.toUpperCase() ?? "?";
};

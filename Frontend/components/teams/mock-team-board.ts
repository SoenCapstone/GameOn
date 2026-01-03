export type BoardCard = {
  id: string;
  teamId: string;

  title: string;
  description: string;

  category: "Announcement" | "Task" | "Event" | "Update";
  author: string;

  createdAt: string;
  dueAt?: string;

  tags: string[];
  unreadCount: number;
};

const mockBoardCards: BoardCard[] = [
  // Montreal FC
  {
    id: "c1",
    teamId: "b3e1c2d4-5f6a-4b7c-8d9e-0123456789ab",
    title: "Training moved to 7:30 PM",
    description: "Field B is unavailable earlier. Bring shin guards + water.",
    category: "Update",
    author: "Coach Alex",
    createdAt: "2025-12-29T01:20:00.000Z",
    tags: ["Training", "Schedule"],
    unreadCount: 3,
  },
  {
    id: "c2",
    teamId: "b3e1c2d4-5f6a-4b7c-8d9e-0123456789ab",
    title: "Game day checklist",
    description: "Arrive 45 min early. Jerseys, socks, and ID required.",
    category: "Task",
    author: "Team Admin",
    createdAt: "2025-12-28T18:05:00.000Z",
    dueAt: "2025-12-30T22:00:00.000Z",
    tags: ["Game", "Reminder"],
    unreadCount: 0,
  },
  {
    id: "c4",
    teamId: "b3e1c2d4-5f6a-4b7c-8d9e-0123456789ab",
    title: "Team dinner after match",
    description:
      "Reserve your spot. We’re going to La Banquise after the game.",
    category: "Event",
    author: "Jack",
    createdAt: "2025-12-27T23:10:00.000Z",
    tags: ["Social", "Food"],
    unreadCount: 1,
  },

  // Toronto Blue Jays
  {
    id: "c3",
    teamId: "d2b8f3c4-6e7a-48b1-9f2d-1234567890ab",
    title: "Roster update",
    description: "New player added to the lineup. Check the updated positions.",
    category: "Announcement",
    author: "Staff",
    createdAt: "2025-12-28T12:00:00.000Z",
    tags: ["Roster"],
    unreadCount: 2,
  },
];

export function fetchTeamBoardCards(teamId: string, query?: string) {
  return new Promise<BoardCard[]>((resolve) => {
    setTimeout(() => {
      const q = (query ?? "").toLowerCase().trim();

      const filtered = mockBoardCards
        .filter((c) => c.teamId === teamId)
        .filter((c) => {
          if (!q) return true;
          return (
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.author.toLowerCase().includes(q) ||
            c.tags.some((t) => t.toLowerCase().includes(q))
          );
        });

      resolve(filtered);
    }, 250);
  });
}

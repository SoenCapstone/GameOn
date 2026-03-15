import {
  Calendar03Icon,
  ChampionIcon,
  FileIcon,
  Flag01Icon,
  Location01Icon,
  MailIcon,
  User03Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SectionCardsProps = {
  totals: {
    users: number;
    teams: number;
    matches: number;
    leagues: number;
    posts: number;
    messages: number;
    referees: number;
    venues: number;
  };
};

const cardDefinitions: Array<{
  key: keyof SectionCardsProps["totals"];
  title: string;
  footer: string;
  icon: typeof User03Icon;
}> = [
  {
    key: "users",
    title: "Users",
    footer: "Total accounts",
    icon: User03Icon,
  },
  {
    key: "teams",
    title: "Teams",
    footer: "Active teams",
    icon: UserMultiple02Icon,
  },
  {
    key: "matches",
    title: "Matches",
    footer: "Total matches",
    icon: Calendar03Icon,
  },
  {
    key: "leagues",
    title: "Leagues",
    footer: "Active leagues",
    icon: ChampionIcon,
  },
  {
    key: "posts",
    title: "Posts",
    footer: "Published posts",
    icon: FileIcon,
  },
  {
    key: "messages",
    title: "Messages",
    footer: "Visible chat messages",
    icon: MailIcon,
  },
  {
    key: "referees",
    title: "Referees",
    footer: "Referee profiles",
    icon: Flag01Icon,
  },
  {
    key: "venues",
    title: "Venues",
    footer: "Saved match locations",
    icon: Location01Icon,
  },
];

function formatTotal(value: number): string {
  return value.toLocaleString("en-US");
}

export function SectionCards({ totals }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:px-6 @5xl/main:grid-cols-4">
      {cardDefinitions.map((card) => (
        <Card
          key={card.key}
          className="from-primary/5 to-card bg-gradient-to-t shadow-xs"
        >
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatTotal(totals[card.key])}
            </CardTitle>
            <CardAction>
              <Badge
                variant="outline"
                className="size-8 justify-center p-0 [&>svg]:size-4!"
              >
                <HugeiconsIcon
                  icon={card.icon}
                  strokeWidth={2}
                />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="text-muted-foreground text-sm">
            {card.footer}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

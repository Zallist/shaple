export type Game = {
    name: string;
    description: string;
    path: string;
    icon_path: string;
    color: string;
    class: string;
};

export const Games: Game[] = [
    {
        name: "Shaple",
        description: "Wordle with shapes. Arrange symbols under adjacency rules to reveal the hidden pattern.",
        path: `${import.meta.env.BASE_URL}shaple/`,
        icon_path: `${import.meta.env.BASE_URL}shaple/favicon.png`,
        color: "indigo",
        class: "bg-gradient-to-br from-indigo-700 to-indigo-600"
    },
    {
        name: "Droptionary",
        description: "Word search crossed with Bejeweled. Find words, collapse the grid, trigger chains.",
        path: `${import.meta.env.BASE_URL}droptionary/`,
        icon_path: `${import.meta.env.BASE_URL}droptionary/favicon.png`,
        color: "amber",
        class: "bg-gradient-to-bl from-amber-700 to-amber-600"
    }
];

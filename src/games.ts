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
        description: "A word game where you guess words based on their shapes",
        path: `${import.meta.env.BASE_URL}shaple/`,
        icon_path: `${import.meta.env.BASE_URL}shaple/favicon.png`,
        color: "blue",
        class: "bg-gradient-to-br from-blue-700 to-blue-600"
    },
    {
        name: "Bewordle",
        description: "A word guessing game inspired by Wordle",
        path: `${import.meta.env.BASE_URL}bewordle/`,
        icon_path: `${import.meta.env.BASE_URL}bewordle/favicon.png`,
        color: "green",
        class: "bg-gradient-to-bl from-green-700 to-green-600"
    }
];

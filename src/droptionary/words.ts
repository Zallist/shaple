const url = `${import.meta.env.BASE_URL}word-list.json`;

export default async function getWords(): Promise<string[]> {
    return await fetch(url).then(r => r.json());
};
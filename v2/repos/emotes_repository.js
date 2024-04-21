class EmotesRepository {
    static #emotes = [];
    static #loaded = false;

    static async load() {
        if (!this.#loaded) {
            await this.#loadFfzEmotes();
            await this.#loadSevenTvEmotes();
            await this.#loadBetterTvEmotes();

            this.#loaded = true;
        }
    }

    static async #loadFfzEmotes() {
        const ffzResults = await (await fetch('https://api.frankerfacez.com/v1/set/global/ids')).json();
        Object.entries(ffzResults.sets).forEach(set => {
            set.at(1).emoticons.forEach(emote => {
                this.#emotes.push(new Emote(emote.id, emote.name, emote.name, emote.urls['4']))
            });
        });
    }

    static async #loadSevenTvEmotes() {
        const sevenTvResults = await (await fetch('https://7tv.io/v3/emote-sets/global')).json();
        sevenTvResults.emotes.forEach(emote => {
            const url = `https:${emote.data.host.url}/${emote.data.host.files.at(4).name}`;
            this.#emotes.push(new Emote(emote.id, emote.name, emote.name, url));
        });
    }

    static async #loadBetterTvEmotes() {
        const bttvResults = await (await fetch('https://api.betterttv.net/3/cached/emotes/global')).json();
        bttvResults.forEach(emote => {
            const url = `https://cdn.betterttv.net/emote/${emote.id}/3x.${emote.imageType}`;
            this.#emotes.push(new Emote(emote.id, emote.code, emote.code, url))
        });
    }

    static getById(id) {
        return this.#emotes.find(emote => emote.id === id);
    }

    static getByCode(code) {
        return this.#emotes.find(emote => emote.code === code);
    }

    static add(emote) {
        if (this.getByCode(emote.code) === undefined) {
            this.#emotes.push(emote);
        }
    }

    static get emotes() {
        return this.#emotes;
    }

    static get emoteCodes() {
        return this.#emotes.map(emote => emote.code);
    }
}
class Message {
    #id;
    #content;
    static #kickEmoteRegExp = /\[emote:\d+:[^\]]*]/g;

    constructor(id, content) {
        this.#id = id;
        this.#content = escapeHtml(content);
    }

    #replaceEmotes() {
        EmotesRepository.emoteCodes.forEach(code => {
            if (!this.#content.includes(code)) {
                return;
            }

            if (code === this.#content) {
                this.#content = EmotesRepository.getByCode(code)?.toHtml();
                return;
            }

            if (code.search(this.constructor.#kickEmoteRegExp) !== -1) {
                this.#content = this.#content.replaceAll(code, EmotesRepository.getByCode(code)?.toHtml());
            }

            const regex = new RegExp(`(?<!\\S)(${escapeRegExp(code)})(?!\\S)`, 'g');
            if (this.#content.search(regex) !== -1) {
                this.#content = this.#content.replace(regex, EmotesRepository.getByCode(code)?.toHtml());
            }
        });
    }

    toHtml() {
        this.#replaceEmotes();

        return this.#content;
    }

    toString() {
        return this.toHtml();
    }

    get id() {
        return this.#id;
    }

    get content() {
        return this.#content;
    }
}
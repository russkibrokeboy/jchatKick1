class Message {
    #id;
    #content;

    constructor(id, content) {
        this.#id = id;
        this.#content = escapeHtml(content);
        this.#replaceEmotes();
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

            if (code.search(ChatOptions.kickEmoteRegexp) !== -1) {
                this.#content = this.#content.replaceAll(code, EmotesRepository.getByCode(code)?.toHtml());
            }

            const regex = new RegExp(`(?<!\\S)(${escapeRegExp(code)})(?!\\S)`, 'g');
            if (this.#content.search(regex) !== -1) {
                this.#content = this.#content.replace(regex, EmotesRepository.getByCode(code)?.toHtml());
            }
        });
    }

    toHtml() {
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
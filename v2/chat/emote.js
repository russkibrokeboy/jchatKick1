class Emote {
    #id;
    #code;
    #alt = '';
    #url;
    static #kickBaseUrl = 'https://files.kick.com/emotes';

    constructor(id, code, alt, url) {
        this.#id = id;
        this.#code = code;
        this.#alt = alt;
        this.#url = url;
    }

    toHtml() {
        if (this.#url) {
            return `<img class="emote" src="${this.#url}" alt="${this.#alt}">`;
        }

        return `<img class="emote" src="${this.constructor.#kickBaseUrl}/${this.#id}/fullsize" alt="${this.#alt}">`;
    }

    toString() {
        return this.toHtml();
    }

    get code() {
        return this.#code;
    }

    get id() {
        return this.#id;
    }
}
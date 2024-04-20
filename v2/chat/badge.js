class Badge {
    #type;
    #url;
    #months;

    constructor(type, url, months) {
        this.#type = type;
        this.#url = url;
        this.#months = months;
    }

    toHtml() {
        return `<img class="badge" src="${this.#url}" alt="${this.#type}">`;
    }

    get type() {
        return this.#type;
    }

    get months() {
        return this.#months;
    }
}
class ChatOptions {
    static #size = 3;
    static #font = 0;
    static #stroke = false;
    static #shadow = false;
    static #animate = false;
    static #fade = false;
    static #smallCaps = false;
    static #showReplies = false;

    static setOptions(data) {
        if (data.size !== undefined) {
            this.#size = parseInt(data.size);
        }

        if (data.font !== undefined) {
            this.#font = parseInt(data.font);
        }

        if (data.stroke !== undefined) {
            this.#stroke = parseInt(data.stroke);
        }

        if (data.shadow !== undefined) {
            this.#shadow = parseInt(data.shadow);
        }

        if (data.animate !== undefined) {
            this.#animate = data.animate.toLowerCase() === 'true';
        }

        if (data.fade !== undefined) {
            this.#fade = parseInt(data.fade);
        }

        if (data.small_caps !== undefined) {
            this.#smallCaps = data.small_caps.toLowerCase() === 'true';
        }

        if (data.show_replies !== undefined) {
            this.#showReplies = data.show_replies.toLowerCase() === 'true';
        }
    }

    static get size() {
        return this.#size;
    }

    static get font() {
        return this.#font;
    }

    static get stroke() {
        return this.#stroke;
    }

    static get shadow() {
        return this.#shadow;
    }

    static get animate() {
        return this.#animate;
    }

    static get fade() {
        return this.#fade;
    }

    static get smallCaps() {
        return this.#smallCaps;
    }

    static get showReplies() {
        return this.#showReplies;
    }

    static get kickEmoteRegexp() {
        return /\[emote:\d+:[^\]]*]/g;
    }
}
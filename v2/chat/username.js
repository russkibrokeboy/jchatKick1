class UserName {
    #id;
    #name;
    #badges = [];
    #color;

    constructor(id, name, badges, color) {
        this.#id = id;
        this.#name = name;
        this.#badges = badges;
        this.#color = color;
    }

    toHtml() {
        const userInfo = $('<span class="user_info"></span>');
        this.#badges.forEach(badge => {
            userInfo.append(badge.toHtml());
        });
        userInfo.append(`<span class="nick" style="color: ${this.#color}">${this.#name}</span>`);
        userInfo.append('<span class="colon">:</span>');

        return userInfo;
    }

    toString() {
        return this.toHtml();
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }
}
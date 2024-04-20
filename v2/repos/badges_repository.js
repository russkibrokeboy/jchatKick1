class BadgesRepository {
    static #kickBaseUrl = './../badges';
    static #badges = [
        new Badge('broadcaster', `${this.#kickBaseUrl}/broadcaster.svg`),
        new Badge('moderator', `${this.#kickBaseUrl}/moderator.svg`),
        new Badge('sub_gifter_1-29', `${this.#kickBaseUrl}/sub_gifter_1-29.svg`),
        new Badge('sub_gifter_30-49', `${this.#kickBaseUrl}/sub_gifter_30-49.svg`),
        new Badge('sub_gifter_50-99', `${this.#kickBaseUrl}/sub_gifter_50-99.svg`),
        new Badge('sub_gifter_100-199', `${this.#kickBaseUrl}/sub_gifter_100-199.svg`),
        new Badge('sub_gifter_200-', `${this.#kickBaseUrl}/sub_gifter_200-.svg`),
        new Badge('vip', `${this.#kickBaseUrl}/vip.svg`),
        new Badge('og', `${this.#kickBaseUrl}/og.svg`),
        new Badge('verified', `${this.#kickBaseUrl}/verified.svg`),
        new Badge('founder', `${this.#kickBaseUrl}/founder.svg`),
    ];

    static getByType(type, count) {
        if (type === 'sub_gifter' && count) {
            const _type = `${type}_${this.#getSubGifterCountCode(count)}`;
            return this.#badges.find(badge => badge.type === _type);
        }
        return this.#badges.find(badge => badge.type === type);
    }

    static getByCount(count) {
        return this.#badges
            .filter(chatBadge => chatBadge.months <= count)
            .sort(chatBadge => -chatBadge.months)
            .at(0);
    }

    static #getSubGifterCountCode(count = 0) {
        switch (true) {
            case count >= 1 && count <= 29:
                return '1-29';
            case count >= 30 && count <= 49:
                return '30-49';
            case count >= 50 && count <= 99:
                return '50-99';
            case count >= 100 && count <= 199:
                return '100-199';
            default:
                return '200-';
        }
    }

    static add(badge) {
        this.#badges.push(badge);
    }
}
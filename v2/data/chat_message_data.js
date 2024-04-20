class ChatMessageData {
    #messageId;
    #messageContent;
    #senderId;
    #senderUserName;
    #senderBadges;
    #senderColor;

    constructor(data) {
        this.#messageId = data.id;
        this.#messageContent = data.content;
        this.#senderId = data.sender.id;
        this.#senderUserName = data.sender.username;
        this.#senderBadges = data.sender.identity.badges;
        this.#senderColor = data.sender.identity.color;
    }

    get messageId() {
        return this.#messageId;
    }

    get messageContent() {
        return this.#messageContent;
    }

    get senderId() {
        return this.#senderId;
    }

    get senderUserName() {
        return this.#senderUserName;
    }

    get senderBadges() {
        return this.#senderBadges;
    }

    get senderColor() {
        return this.#senderColor;
    }
}
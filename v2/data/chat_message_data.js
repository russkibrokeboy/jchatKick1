class ChatMessageData {
    #type;
    #messageId;
    #messageContent;
    #senderId;
    #senderUserName;
    #senderBadges;
    #senderColor;
    #originalMessageContent;
    #originalSenderUserName;

    constructor(data) {
        this.#type = data.type;
        this.#messageId = data.id;
        this.#messageContent = data.content;
        this.#senderId = data.sender.id;
        this.#senderUserName = data.sender.username;
        this.#senderBadges = data.sender.identity.badges;
        this.#senderColor = data.sender.identity.color;
        this.#originalMessageContent = data.metadata?.original_message?.content;
        this.#originalSenderUserName = data.metadata?.original_sender?.username;
    }

    get type() {
        return this.#type;
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

    get originalMessageContent() {
        return this.#originalMessageContent;
    }

    get originalMessageSenderUserName() {
        return this.#originalSenderUserName;
    }
}
class Reply extends Message {
    #replyTo;
    constructor(id, content, replyTo) {
        super(id, content);
        this.#replyTo = replyTo;
    }

    toHtml() {
        const img = '<img class="reply-icon" src="./../icons/reply_arrow.svg" alt="">'
        return `<span class="reply truncate">${img} Replying to @${this.#replyTo}: ${this.content}</span>`;
    }
}
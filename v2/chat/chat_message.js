class ChatMessage {
    #messageData;
    #userName;
    #message;
    static #kickBadges = ['broadcaster', 'moderator', 'sub_gifter', 'vip', 'og', 'verified', 'founder'];

    /**
     * @param {ChatMessageData} messageData
     */
    constructor(messageData) {
        this.#messageData = messageData;
        this.#addKickEmotes();
        this.#setUserName();
        this.#setMessage();
    }

    #setUserName() {
        this.#userName = new UserName(
            this.#messageData.senderId,
            this.#messageData.senderUserName,
            this.#getSenderBadges(),
            this.#messageData.senderColor
        );
    }

    #setMessage() {
        this.#message = new Message(
            this.#messageData.messageId,
            this.#messageData.messageContent
        );
    }

    #getSenderBadges() {
        const badges = [];
        this.#messageData.senderBadges.forEach(badge => {
            if (this.constructor.#kickBadges.includes(badge.type)) {
                badges.push(BadgesRepository.getByType(badge.type, badge.count));
            } else if ('count' in badge) {
                badges.push(BadgesRepository.getByCount(badge.count));
            }
        });

        return badges;
    }

    #addKickEmotes() {
        try {
            const matches = this.#messageData.messageContent.match(ChatOptions.kickEmoteRegexp);

            if (matches !== null) {
                matches.forEach(match => {
                    const parts = match.substring(7, match.length - 1).split(':');

                    EmotesRepository.add(new Emote(parts.at(0), match, parts.at(1)));
                });
            }

        } catch (error) {
            console.error("Error while trying to add kick emote from message content: ", error);
        }
    }

    get #showReply() {
        return ChatOptions.showReplies && this.#messageData.type === 'reply';
    }

    toHtml() {
        const $chatLine = $('<div></div>');
        $chatLine.addClass('chat_line');
        $chatLine.attr('data-nick', this.#userName.name);
        $chatLine.attr('data-time', Date.now());
        $chatLine.attr('data-id', this.#message.id);
        $chatLine.attr('data-user-id', this.#userName.id);

        $chatLine.append(this.#userName.toHtml());
        $chatLine.append(this.#message.toHtml());

        if(this.#showReply) {
            const reply = new Reply(this.#messageData.id, this.#messageData.originalMessageContent, this.#messageData.originalMessageSenderUserName);
            $chatLine.prepend(reply.toHtml());
        }

        return $chatLine.wrap('<div>').parent().html();
    }

    toString() {
        return this.toHtml();
    }
}

class Chatroom {
    #info = {};
    static #baseUrl = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679";

    constructor(user, maxMessages, animate, fade, showBadges, hideCommands, hideBots, externalCss) {
        this.user = user;
        this.maxMessages = maxMessages;
        this.subBadges = [];
        this.emotes = {};
        this.name_colours = {};
        this.animate = animate === "true";
        this.fade = fade;
        this.showBadges = showBadges === "true";
        this.hideBots = hideBots === "true";
        this.hideCommands = hideCommands === "true";
        this.externalCss = externalCss;

        this.seventvbadges = {};
        this.seventvpaints = {};
        this.userInfoCache = {};
        this.seventvProfileCache = {};

        this.#load().then(() => this.#connect());
        this.#update();
    }

    async #load() {
        const res = await (await fetch('https://kick.com/api/v2/channels/' + this.user)).json();

        this.#info.channelID = res.id;
        this.#info.chatRoomId = res.chatroom.id;
        await this.getSubBadgesAndEmotes(res);

        if (this.externalCss) {
            appendCSS('external', this.externalCss);
        }

        if (this.animate) {
            appendCSS('animate', 'true');
        }

        if (this.fade) {
            appendCSS('fade', this.fade);
        }

        if (this.showBadges) {
            appendCSS('showBadges', 'true');
        }

        this.#info.contentLoaded = true;
    }

    async getSubBadgesAndEmotes(userData) {
        await this.get7TVProfile(userData.user_id).then((response) => {
            if (response.status_code === 404) {
                return null;
            } else {
                this.loadEmotes(response.emote_set.id);
            }
        });
        this.subBadges = userData.subscriber_badges;
        this.subBadges.sort((a, b) => (a.months > b.months ? 1 : -1));
    }

    async get7TVProfile(userID) {
        try {
            const response = await fetch(`https://7tv.io/v3/users/kick/${userID}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.log("No 7TV profile found for " + userID);
                } else {
                    throw new Error("Error: " + response.status);
                }
            }
            const data = await response.json();
            return data;
        } catch (error) {
            return null;
        }
    }

    loadEmotes(emoteSetID) {
        [
            "emote-sets/global",
            "emote-sets/" + encodeURIComponent(emoteSetID),
        ].forEach((endpoint) => {
            $.getJSON("https://7tv.io/v3/" + endpoint).done((res) => {
                res.emotes.forEach((emote) => {
                    const imageUrl = `https://cdn.7tv.app/emote/${emote.id}/4x.webp`;
                    this.emotes[emote.name] = {
                        id: emote.id,
                        image: imageUrl,
                        zeroWidth: emote.flags === 1,
                    };
                });
            });
        });
    }

    async #connect() {
        if (!this.#info.contentLoaded) {
            await this.#load();
        }

        console.log('Connecting...');
        const urlParams = new URLSearchParams({
            protocol: "7",
            client: "js",
            version: "8.4.0",
            flash: false,
        });

        const url = `${this.constructor.#baseUrl}?${urlParams.toString()}`;

        const socket = new WebSocket(url);

        socket.onopen = () => {
            socket.send(JSON.stringify({
                event: "pusher:subscribe",
                data: {auth: "", channel: `chatrooms.${this.#info.chatRoomId}.v2`},
            }));

            console.log('connected');
        };

        socket.onclose = () => {
            console.log('Disconnected');
            setTimeout(() => this.#connect(), 1e3 * 3);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onmessage = (messageEvent) => {
            const messageEventJSON = JSON.parse(messageEvent.data.toString());
            let data = {};

            if (typeof messageEventJSON.data === 'string') {
                data = JSON.parse(messageEventJSON.data);
            }

            this.parseMessage(data);
        };

        // Ping every 1 minute to keep the connection alive
        setInterval(() => {
            socket.send(
                JSON.stringify({
                    event: "pusher:ping",
                    data: {},
                })
            );
        }, 60000);
    }

    #update() {
        setInterval(() => {
            const chatLine = $('.chat_line');
            if (this.#info.lines.length) {
                const lines = this.#info.lines.join('');

                if (this.animate) {
                    const $auxDiv = $('<div></div>', {class: "hidden"}).appendTo("#chat_container");
                    $auxDiv.append(lines);
                    const auxHeight = $auxDiv.height();
                    $auxDiv.remove();
                }
            }
        }, 1000);
    }

    parseMessage(message) {
        const msg = JSON.parse(message);
        const data = JSON.parse(
            msg.data
                .replace(/\\u00a0/g, " ")
                .replace(/\\n/g, " ")
                .replace(/\\t/g, " ")
                .replace(/\\r/g, " ")
                .replace(/\\f/g, " ")
                .replace(/\\b/g, " ")
                .replace(/\\v/g, " ")
                .replace(/\\\\/g, "\\")
        );

        if (msg.event.startsWith("pusher") && msg.event !== "pusher:pong") {
        } else {
            switch (msg.event) {
                case "App\\Events\\ChatMessageEvent":
                    this.handleMessage(data);
                    break;
                case "App\\Events\\MessageDeletedEvent":
                    this.handleDelete(data);
                    break;
                case "App\\Events\\ChatMessageReact":
                    this.handleReact(data);
                    break;
                case "App\\Events\\UserBannedEvent":
                    this.handleBan(data);
                    break;
                case "App\\Events\\ChatroomClearEvent":
                    this.handleClear(data);
                    break;
                default:
                    console.log(msg.event);
            }
        }
    }

    handleMessage(data) {
        const {
            id: msgID,
            content: msgContent,
            sender,
            sender: { identity },
            created_at: msgTimestamp,
        } = data;
        const msgSender = sender;
        const msgIdentity = identity;

        if (this.hideCommands && msgContent.startsWith("!")) return;

        if (
            this.hideBots &&
            ["livebot", "corardbot", "botrix", "mrbeefbot"].includes(
                msgSender.username.toLowerCase()
            )
        )
            return;

        let parsedContent = this.parseEmotes(msgContent);
        parsedContent = this.parseKickEmojis(parsedContent);
        parsedContent = this.parse7TVEmotes(parsedContent);
        parsedContent = twemoji.parse(parsedContent);

        this.createAndAppendMsg({
            msgID,
            msgSender,
            msgIdentity,
            msgTimestamp,
            msgContent: parsedContent,
        });
    }

    parseEmotes(content) {
        const emoteRegex =
            /\[emote:(\d+):?([\w\s\-~!@#$%^&*()_+=\{}\\|;:'",.<>\/?]+)\]/g;
        const emoteMatches = content.match(emoteRegex);
        if (!emoteMatches) return content;

        for (const emoteMatch of emoteMatches) {
            const emoteId = emoteMatch.match(
                /\[emote:(\d+):?([\w\s\-~!@#$%^&*()_+=\{}\\|;:'",.<>\/?]+)\]/
            )[1];
            content = content.replace(
                emoteMatch,
                `<img src="https://d2egosedh0nm8l.cloudfront.net/emotes/${emoteId}/fullsize" class="emote">`
            );
        }
        return content;
    }

    parseKickEmojis(content) {
        const kickEmojiRegex = /\[emoji:(\w+)\]/g;
        const kickEmojiMatches = content.match(kickEmojiRegex);
        if (!kickEmojiMatches) return content;

        for (const kickEmojiMatch of kickEmojiMatches) {
            const kickEmojiName = kickEmojiMatch.match(/\[emoji:(\w+)\]/)[1];
            content = content.replace(
                kickEmojiMatch,
                `<img src="https://dbxmjjzl5pc1g.cloudfront.net/9ad84c86-99f0-4f0a-8e1a-baccf20502b9/images/emojis/${kickEmojiName}.png" class="emote">`
            );
        }
        return content;
    }

    parse7TVEmotes(content) {
        const msgWords = content.split(" ");
        for (const word of msgWords) {
            if (this.emotes[word]) {
                content = content.replace(
                    word,
                    "<img class='emote' src='" + this.emotes[word].image + "' />"
                );
            }
        }
        return content;
    }

    async createAndAppendMsg({
        msgID,
        msgSender,
        msgIdentity,
        msgTimestamp,
        msgContent,
    }) {
        // Create the message element
        let msg = document.createElement("div");
        msg.classList.add("chat_line");
        msg.setAttribute("data-id", msgID);
        msg.setAttribute("data-sender", msgSender.username);
        msg.setAttribute("data-timestamp", msgTimestamp);

        // Add a child span element for the user info
        let msgInfo = document.createElement("span");
        msgInfo.classList.add("user_info");

        // Add a child span element for the username
        let msgUsernameWrapper = document.createElement("span");

        let usernameColor = msgIdentity.color;

        let msgUsernameSpan = document.createElement("span");
        msgUsernameSpan.classList.add("username");
        msgUsernameSpan.style.color = usernameColor;
        msgUsernameSpan.innerHTML = msgSender.username;
        msgUsernameWrapper.appendChild(msgUsernameSpan);

        // Add a child span element for the colon
        let msgColonSpan = document.createElement("span");
        msgColonSpan.classList.add("colon");
        msgColonSpan.innerHTML = ": ";

        // Append the username, and colon to the user info in the desired order
        msgInfo.appendChild(msgUsernameWrapper);
        msgInfo.appendChild(msgColonSpan);

        // Add a child span element for the badges
        let msgBadgesSpan = document.createElement("span");
        msgBadgesSpan.classList.add("badges");

        if (this.showBadges) {
            this.badges(msgSender, msgIdentity).then((badges) => {
                msgBadgesSpan.innerHTML = badges.badgesArray;
                // Prepend the badges to the user info
                msgInfo.insertBefore(msgBadgesSpan, msgUsernameWrapper);
            });
        }

        // Add a child span element for the message content
        let msgContentSpan = document.createElement("span");
        msgContentSpan.classList.add("message_content");
        msgContentSpan.innerHTML = msgContent;

        // Add the user info and message content to the message element
        msg.appendChild(msgInfo);
        msg.appendChild(msgContentSpan);

        this.handleAnimationAndFading(msg);
        this.handleMessageLimit();

        // Add the message element to the chat
        document.getElementById("chat-container").appendChild(msg);
    }

    handleAnimationAndFading(msg) {
        // Animate the message up
        if (this.animate) {
            msg.classList.add("animate");
        }

        if (this.fade) {
            // Fade out after fade seconds
            setTimeout(() => {
                msg.classList.add("fade");
                setTimeout(() => {
                    msg.remove();
                }, 1000);
            }, this.fade * 1000);
        }
    }

    handleMessageLimit() {
        // Remove messages outside of the max message limit
        if (this.maxMessages > 0) {
            let messages = document.querySelectorAll(".chat_line");
            if (messages.length > this.maxMessages) {
                messages[0].remove();
            }
        }
    }

    handleDelete(data) {
        let msgID = data.message.id;

        // Delete the div with the data-id attribute matching the deleted message's ID
        document.querySelector(`[data-id="${msgID}"]`).remove();
    }

    handleReact(data) {
        return;
    }

    handleBan(data) {
        let bannedUser = data.user.username;

        // Delete all messages where data-sender attribute matches the banned user's username
        document
            .querySelectorAll(`[data-sender="${bannedUser}"]`)
            .forEach((msg) => {
                msg.remove();
            });
    }

    handleClear(data) {
        document.getElementById("chat-container").innerHTML = "";
    }
}

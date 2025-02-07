class Chat {
    #info = {};
    static #baseUrl = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679";

    constructor(info) {
        this.#info = info;
        this.#load().then(() => this.#connect());
        this.#update();
    }

    async #load() {
        const res = await (await fetch('https://kick.com/api/v2/channels/' + this.#info.channel)).json();

        this.#info.channelID = res.id;
        this.#info.chatRoomId = res.chatroom.id;
        await EmotesRepository.load();

        let size = sizes[ChatOptions.size - 1];
        let font = fonts[ChatOptions.font];

        appendCSS('size', size);
        appendCSS('font', font);

        if (ChatOptions.stroke && ChatOptions.stroke > 0) {
            let stroke = strokes[ChatOptions.stroke - 1];
            appendCSS('stroke', stroke);
        }
        if (ChatOptions.shadow && ChatOptions.shadow > 0) {
            let shadow = shadows[ChatOptions.shadow - 1];
            appendCSS('shadow', shadow);
        }
        if (ChatOptions.smallCaps) {
            appendCSS('variant', 'SmallCaps');
        }

        BadgesRepository.load([...res.subscriber_badges, ...res.follower_badges]);
        this.#info.contentLoaded = true;
    }

    #update() {
        setInterval(() => {
            const chatLine = $('.chat_line');
            if (this.#info.lines.length) {
                const lines = this.#info.lines.join('');

                if (ChatOptions.animate) {
                    const $auxDiv = $('<div></div>', {class: "hidden"}).appendTo("#chat_container");
                    $auxDiv.append(lines);
                    const auxHeight = $auxDiv.height();
                    $auxDiv.remove();

                    const $animDiv = $('<div></div>');
                    $('#chat_container').append($animDiv);
                    $animDiv.animate({"height": auxHeight}, 150, function () {
                        $(this).remove();
                        $('#chat_container').append(lines);
                    });
                } else {
                    $('#chat_container').append(lines);
                }
                this.#info.lines = [];

                for (let i = chatLine.length - 100; i > 0; i--) {
                    chatLine.eq(0).remove();
                }

            } else if (ChatOptions.fade) {
                const messageTime = chatLine.eq(0).data('time');
                if ((Date.now() - messageTime) / 1000 >= ChatOptions.fade) {
                    chatLine.eq(0).fadeOut(function () {
                        $(this).remove();
                    });
                }
            }
        }, 200)
    }

    #onMessageDeletedHandler(id) {
        $(`div[data-id=${id}]`).remove();
    }

    #onUserBannedHandler(id) {
        $(`div[data-user-id=${id}]`).remove();
    }

    async #connect(channel) {
        if (!this.#info.contentLoaded) {
            this.#info.channel = channel;
            const title = $(document).prop('title');
            $(document).prop('title', title + this.#info.channel);

            await this.#load();
        }

        displayLog('Connecting...');
        const urlParams = new URLSearchParams({
            protocol: "7",
            client: "js",
            version: "8.4.0-rc2",
            flash: false,
        });

        const url = `${this.constructor.#baseUrl}?${urlParams.toString()}`;

        const socket = new WebSocket(url);

        socket.onopen = () => {
            socket.send(JSON.stringify({
                event: "pusher:subscribe",
                data: {auth: "", channel: `chatrooms.${this.#info.chatRoomId}.v2`},
            }));

            displayLog('connected');
        };

        socket.onclose = () => {
            displayLog('Disconnected');
            setTimeout(this.#connect, 1e3 * 3, this.#info.channel);
        };

        socket.onmessage = (messageEvent) => {
            const messageEventJSON = JSON.parse(messageEvent.data.toString());
            let data = {};

            if (typeof messageEventJSON.data === 'string') {
                data = JSON.parse(messageEventJSON.data);
            }

            switch (messageEventJSON.event) {
                case "App\\Events\\ChatMessageEvent":
                    this.#onMessageHandler(data);

                    break;
                case "App\\Events\\MessageDeletedEvent":
                    this.#onMessageDeletedHandler(data.message.id);

                    break;
                case "App\\Events\\UserBannedEvent":
                    this.#onUserBannedHandler(data.user.id);

                    break;
            }
        }
    }

    #onMessageHandler(data) {
        const chatMessage = new ChatMessage(new ChatMessageData(data));
        this.#info.lines.push(chatMessage.toHtml());
    }
}

function displayLog(message) {
    console.log(message);
    const logElement = $(`<div class="log-message">${message}</div>`);
    $('#log_container').append(logElement);
    
    // Fade out after 1 second and remove from DOM
    setTimeout(() => {
        logElement.fadeOut(400, () => {
            logElement.remove();
        });
    }, 1000);
}


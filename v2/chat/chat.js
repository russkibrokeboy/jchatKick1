class Chat {
    #options = {};
    #baseUrl = "wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c";

    constructor(options) {
        this.#options = options;
        this.#load();
        this.#connect(this.#options.channel);
        this.#update();
    }

    async #load() {
        const res = await (await fetch('https://kick.com/api/v2/channels/' + this.#options.channel)).json();

        this.#options.channelID = res.id;
        this.#options.chatRoomId = res.chatroom.id;
        await EmotesRepository.load();

        let size = sizes[this.#options.size - 1];
        let font = fonts[this.#options.font];

        appendCSS('size', size);
        appendCSS('font', font);

        if (this.#options.stroke && this.#options.stroke > 0) {
            let stroke = strokes[this.#options.stroke - 1];
            appendCSS('stroke', stroke);
        }
        if (this.#options.shadow && this.#options.shadow > 0) {
            let shadow = shadows[this.#options.shadow - 1];
            appendCSS('shadow', shadow);
        }
        if (this.#options.smallCaps) {
            appendCSS('variant', 'SmallCaps');
        }

        [...res.subscriber_badges, ...res.follower_badges].forEach(badge => {
            BadgesRepository.add(new Badge(badge.text ?? '', badge.badge_image.src, badge.months));
        });

        this.#options.contentLoaded = true;
    }

    #update() {
        setInterval(() => {
            if (this.#options.lines.length > 0) {
                const lines = this.#options.lines.join('');

                if (this.#options.animate) {
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
                this.#options.lines = [];
                let linesToDelete = $('.chat_line').length - 100;
                while (linesToDelete > 0) {
                    $('.chat_line').eq(0).remove();
                    linesToDelete--;
                }
            } else if (this.#options.fade) {
                const messageTime = $('.chat_line').eq(0).data('time');
                if ((Date.now() - messageTime) / 1000 >= this.#options.fade) {
                    $('.chat_line').eq(0).fadeOut(function () {
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
        if (!this.#options.contentLoaded) {
            this.#options.channel = channel;
            const title = $(document).prop('title');
            $(document).prop('title', title + this.#options.channel);


            await this.#load();
        }

        console.log('Connecting...');
        const urlParams = new URLSearchParams({
            protocol: "7",
            client: "js",
            version: "7.4.0",
            flash: false,
        });

        const url = `${this.#baseUrl}?${urlParams.toString()}`;

        const socket = new WebSocket(url);

        socket.onopen = () => {
            socket.send(JSON.stringify({
                event: "pusher:subscribe",
                data: {auth: "", channel: `chatrooms.${this.#options.chatRoomId}.v2`},
            }));

            console.log('connected');
        };

        socket.onclose = () => {
            console.log('Disconnected');
            setTimeout(Chat.connect, 1e3 * 3, this.#options.channel);
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
        this.#options.lines.push(chatMessage.toHtml());
    }
}
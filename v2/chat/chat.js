<div id="chat-container"></div>
class Chat {
    #info = {};
    static #baseUrl = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679";

    constructor(user, maxMessages, animate, fade, showBadges, hideCommands, hideBots, externalCss) {
        this.user = user;
        this.maxMessages = maxMessages;
        this.animate = animate === "true";
        this.fade = fade;
        this.showBadges = showBadges === "true";
        this.hideCommands = hideCommands === "true";
        this.hideBots = hideBots === "true";
        this.externalCss = externalCss;
        this.#info = { lines: [] };

        // Start the connection
        this.#connect(user);
        // Start the update loop
        this.update();
    }

    showConnectionStatus(status) {
        const statusElement = document.createElement('div');
        statusElement.id = 'connection-status';
        statusElement.textContent = status;
        statusElement.style.position = 'fixed';
        statusElement.style.top = '10px';
        statusElement.style.right = '10px';
        statusElement.style.padding = '5px 10px';
        statusElement.style.backgroundColor = 'green';
        statusElement.style.color = 'white';
        statusElement.style.borderRadius = '5px';
        document.body.appendChild(statusElement);

        // Remove the status message after 5 seconds
        setTimeout(() => {
            statusElement.remove();
        }, 5000);
    }
update() {
    setInterval(() => {
        this.updateChat();
    }, 200);
}



    async #load() {
        const res = await fetch('https://kick.com/api/v2/channels/' + this.#info.channel).then(r => r.json());

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


    updateChat() {
        const chatLines = document.querySelectorAll('.chat_line');

        if (this.#info && this.#info.lines && this.#info.lines.length) {
            const lines = this.#info.lines.join('');

            if (this.animate) {
                this.animateNewMessages(lines);
            } else {
                document.getElementById('chat-container').insertAdjacentHTML('beforeend', lines);
            }
            this.#info.lines = [];

            // Remove excess messages
            this.removeExcessMessages(chatLines);
        } else if (this.fade) {
            this.fadeOldMessages(chatLines);
        }
    }

    animateNewMessages(lines) {
        const auxDiv = document.createElement('div');
        auxDiv.style.visibility = 'hidden';
        auxDiv.innerHTML = lines;
        document.getElementById('chat-container').appendChild(auxDiv);
        const auxHeight = auxDiv.offsetHeight;
        auxDiv.remove();

        const animDiv = document.createElement('div');
        document.getElementById('chat-container').appendChild(animDiv);

        // Using Web Animations API for animation
        const animation = animDiv.animate([
            { height: '0px' },
            { height: `${auxHeight}px` }
        ], {
            duration: 150,
            easing: 'ease-out'
        });

        animation.onfinish = () => {
            animDiv.remove();
            document.getElementById('chat-container').insertAdjacentHTML('beforeend', lines);
        };
    }

    removeExcessMessages(chatLines) {
        const maxMessages = 100; // Adjust as needed
        for (let i = chatLines.length - maxMessages; i > 0; i--) {
            chatLines[0].remove();
        }
    }

    fadeOldMessages(chatLines) {
        if (chatLines.length > 0) {
            const messageTime = parseInt(chatLines[0].getAttribute('data-timestamp'));
            if ((Date.now() - messageTime) / 1000 >= this.fade) {
                chatLines[0].style.transition = 'opacity 1s';
                chatLines[0].style.opacity = '0';
                setTimeout(() => {
                    chatLines[0].remove();
                }, 1000);
            }
        }
    }



    #onMessageDeletedHandler(id) {
        $(`div[data-id=${id}]`).remove();
    }

    #onUserBannedHandler(id) {
        $(`div[data-user-id=${id}]`).remove();
    }

    #connect(channel) {
        if (!this.#info.contentLoaded) {
            this.#info.channel = channel;
            const title = document.title;
            document.title = title + ' - ' + this.#info.channel;

            this.#load().then(() => {
                // After loading, establish the WebSocket connection
                this.#establishWebSocketConnection();
            });
        } else {
            // If content is already loaded, just establish the WebSocket connection
            this.#establishWebSocketConnection();
        }
    }

    #establishWebSocketConnection() {
        console.log('Attempting to connect...');
        const urlParams = new URLSearchParams({
            protocol: "7",
            client: "js",
            version: "8.4.0-rc2",
            flash: false,
        });

        const url = `${Chat.#baseUrl}?${urlParams.toString()}`;

        try {
            const socket = new WebSocket(url);

            socket.onopen = () => {
                console.log('WebSocket connection established. Subscribing to chat room...');
                socket.send(JSON.stringify({
                    event: "pusher:subscribe",
                    data: {auth: "", channel: `chatrooms.${this.#info.chatRoomId}.v2`},
                }));

                // Add this line to show the connection status
                this.showConnectionStatus('Connected');
            };

            socket.onclose = (event) => {
                console.log(`WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`);
                console.log('Attempting to reconnect in 3 seconds...');
                setTimeout(() => this.#establishWebSocketConnection(), 3000);
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

                if (messageEventJSON.event === "pusher:connection_established") {
                    console.log('Successfully connected and subscribed to chat room.');
                    // You can add code here to update the UI to show "Connected" status
                } else {
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
                        default:
                            console.log('Received unknown event:', messageEventJSON.event);
                    }
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            console.log('Attempting to reconnect in 3 seconds...');
            setTimeout(() => this.#establishWebSocketConnection(), 3000);
        }
    }




    #onMessageHandler(data) {
        this.createAndAppendMsg({
            msgID: data.id,
            msgSender: data.sender.username,
            msgIdentity: data.sender.identity,
            msgTimestamp: data.created_at,
            msgContent: data.content,
        });
    }

    async createAndAppendMsg({
        msgID,
        msgSender,
        msgIdentity,
        msgTimestamp,
        msgContent,
    }) {
        // ... (existing code to create message element)

        const messageHTML = msg.outerHTML;

        if (!this.#info) {
            this.#info = { lines: [] };
        }
        this.#info.lines.push(messageHTML);

        // Remove these methods from here
        // handleAnimationAndFading and handleMessageLimit are now handled in updateChat

}
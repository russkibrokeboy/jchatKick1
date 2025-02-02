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
        
        this.getUserInfoWithRetry();
        this.update();
    }

    async getUserInfoWithRetry() {
        try {
            const userData = await this.getUserInfo(this.user);
            await this.getSubBadgesAndEmotes(userData);
            console.log("Chatroom ID:", userData.chatroom.id);
            this.connectToChatroom(userData.chatroom.id, userData.chatroom.channel_id);
        } catch (error) {
            console.error("Error:", error);
            setTimeout(() => this.getUserInfoWithRetry(), 1000);
        }
    }

    connectToChatroom(chatroomID, channelID) {
        const chat = new WebSocket(
            `${Chat.#baseUrl}?protocol=7&client=js&version=8.4.0-rc2&flash=false`
        );

        chat.onerror = (error) => {
            console.error("WebSocket Error:", error);
        };

        chat.onopen = () => {
            console.log("Connected to Pusher");
            document.getElementById("loading").innerHTML = "Connected";
            setTimeout(() => {
                document.getElementById("loading").style.display = "none";
            }, 1500);
            this.subscribeToChannel(chat, `chatrooms.${chatroomID}.v2`);
            this.subscribeToChannel(chat, `channel.${channelID}`);
        };

        chat.onmessage = (event) => {
            this.parseMessage(event.data);
        };
    }
}

// Make Chat available globally
window.Chat = Chat;

// script.js
$(document).ready(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageSetup = new PageSetup(urlParams);

    if (!urlParams.get("user")) {
        window.location.replace("/");
    } else {
        const chat = new Chat(
            urlParams.get("user"),
            pageSetup.maxMessages,
            urlParams.get("animate"),
            urlParams.get("fade"),
            urlParams.get("badges"),
            urlParams.get("commands"),
            urlParams.get("bots"),
            urlParams.get("external-css")
        );
        pageSetup.applyCustomisation();
    }
});
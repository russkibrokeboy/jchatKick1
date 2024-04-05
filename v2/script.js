(function ($) {
    let params = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
        params[key] = value;
    });

    $.QueryString = params;
})(jQuery);

Chat = {
    info: {
        channel: null,
        animate: ('animate' in $.QueryString ? ($.QueryString.animate.toLowerCase() === 'true') : false),
        fade: ('fade' in $.QueryString ? parseInt($.QueryString.fade) : false),
        size: ('size' in $.QueryString ? parseInt($.QueryString.size) : 3),
        font: ('font' in $.QueryString ? parseInt($.QueryString.font) : 0),
        stroke: ('stroke' in $.QueryString ? parseInt($.QueryString.stroke) : false),
        shadow: ('shadow' in $.QueryString ? parseInt($.QueryString.shadow) : false),
        smallCaps: ('small_caps' in $.QueryString ? ($.QueryString.small_caps.toLowerCase() === 'true') : false),
        emotes: {},
        badges: {},
        lines: [],
        channelID: null,
        chatRoomId: null,
        contentLoaded: false,
    },

    loadEmotes: function (channelID) {
        Chat.info.emotes = {};

        fetch('https://api.frankerfacez.com/v1/set/global/ids')
            .then(res => res.json())
            .then(res => {
                Object.entries(res.sets).forEach(set => {
                    set.at(1).emoticons.forEach(emote => {

                        Chat.info.emotes[emote.name] = {
                            id: emote.id,
                            image: emote.urls['4'],
                        };
                    });
                });
            });

        fetch('https://api.betterttv.net/3/cached/emotes/global')
            .then(res => res.json())
            .then(res => {
                res.forEach(emote => {
                    Chat.info.emotes[emote.code] = {
                        id: emote.id,
                        image: `https://cdn.betterttv.net/emote/${emote.id}/3x.${emote.imageType}`,
                        upscale: true
                    };
                });
            });

        fetch('https://7tv.io/v3/emote-sets/global')
            .then(res => res.json())
            .then(res => {
                res.emotes.forEach(emote => {
                    Chat.info.emotes[emote.name] = {
                        id: emote.id,
                        image: `https:${emote.data.host.url}/${emote.data.host.files.at(4).name}`,
                        zeroWidth: false
                    };
                });
            });

    },

    load: async function () {
        const res = await (await fetch('https://kick.com/api/v2/channels/' + Chat.info.channel)).json();

        Chat.info.channelID = res.id;
        Chat.info.chatRoomId = res.chatroom.id;
        Chat.loadEmotes(Chat.info.channelID);

        let size = sizes[Chat.info.size - 1];
        let font = fonts[Chat.info.font];

        appendCSS('size', size);
        appendCSS('font', font);

        if (Chat.info.stroke && Chat.info.stroke > 0) {
            let stroke = strokes[Chat.info.stroke - 1];
            appendCSS('stroke', stroke);
        }
        if (Chat.info.shadow && Chat.info.shadow > 0) {
            let shadow = shadows[Chat.info.shadow - 1];
            appendCSS('shadow', shadow);
        }
        if (Chat.info.smallCaps) {
            appendCSS('variant', 'SmallCaps');
        }

        Chat.info.badges = [...res.subscriber_badges, ...res.follower_badges];

        Chat.info.contentLoaded = true;
    },

    update: setInterval(function () {
        if (Chat.info.lines.length > 0) {
            const lines = Chat.info.lines.join('');

            if (Chat.info.animate) {
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
            Chat.info.lines = [];
            let linesToDelete = $('.chat_line').length - 100;
            while (linesToDelete > 0) {
                $('.chat_line').eq(0).remove();
                linesToDelete--;
            }
        } else if (Chat.info.fade) {
            const messageTime = $('.chat_line').eq(0).data('time');
            if ((Date.now() - messageTime) / 1000 >= Chat.info.fade) {
                $('.chat_line').eq(0).fadeOut(function () {
                    $(this).remove();
                });
            }
        }
    }, 200),

    write: function (nick, info, message) {
        let color;
        let messageNodes;
        if (info) {
            const $chatLine = $('<div></div>');
            $chatLine.addClass('chat_line');
            $chatLine.attr('data-nick', nick);
            $chatLine.attr('data-time', Date.now());
            $chatLine.attr('data-id', info.id);
            $chatLine.attr('data-user-id', info.userId);
            const $userInfo = $('<span></span>');
            $userInfo.addClass('user_info');


            const badges = [];
            const priorityBadges = ['broadcaster', 'moderator', 'sub_gifter', 'vip', 'og', 'verified', 'founder'];
            if (info.badges.length) {
                info.badges.forEach(badge => {
                    const priority = priorityBadges.includes(badge.type);
                    if (priority) {
                        badges.push({
                            description: badge.text,
                            url: `./../badges/${badge.type}.svg`,
                            priority: priority
                        });
                    } else {
                        badges.push({
                            description: badge.text,
                            url: Chat.info.badges.filter(chatBadge => chatBadge.months <= badge.count).sort(chatBadge => -chatBadge.months).at(0)?.badge_image.src,
                            priority: priority
                        })
                    }
                });
            }

            badges.forEach(badge => {
                const $badge = $('<img/>');
                $badge.addClass('badge');
                $badge.attr('src', badge.url);
                $userInfo.append($badge);
            });


            // Writing username
            const $username = $('<span></span>');
            $username.addClass('nick');
            if (typeof (info.color) === 'string') {
                if (tinycolor(info.color).getBrightness() <= 50) {
                    color = tinycolor(info.color).lighten(30);
                } else {
                    color = info.color;
                }
            } else {
                const twitchColors = ["#FF0000", "#0000FF", "#008000", "#B22222", "#FF7F50", "#9ACD32", "#FF4500", "#2E8B57", "#DAA520", "#D2691E", "#5F9EA0", "#1E90FF", "#FF69B4", "#8A2BE2", "#00FF7F"];
                color = twitchColors[nick.charCodeAt(0) % 15];
            }
            $username.css('color', color);
            $username.html(info.displayName ?? nick);
            $userInfo.append($username);

            // Writing message
            const $message = $('<span></span>');
            $message.addClass('message');
            if (/^\x01ACTION.*\x01$/.test(message)) {
                $message.css('color', color);
                message = message.replace(/^\x01ACTION/, '').replace(/\x01$/, '').trim();
                $userInfo.append('<span>&nbsp;</span>');
            } else {
                $userInfo.append('<span class="colon">:</span>');
            }
            $chatLine.append($userInfo);

            // Replacing emotes
            const replacements = {};
            if (info.emotes.length) {
                info.emotes.forEach(emoteData => {
                    replacements[emoteData.code] = `<img class="emote" src="https://files.kick.com/emotes/${emoteData.id}/fullsize" />`;
                });
            }

            Object.entries(Chat.info.emotes).forEach(emote => {
                if (message.search(escapeRegExp(emote[0])) > -1) {
                    if (emote[1].upscale) replacements[emote[0]] = `<img class="emote upscale" src="${emote[1].image}" alt="${emote[0]}" />`;
                    else if (emote[1].zeroWidth) replacements[emote[0]] = `<img class="emote" data-zw="true" src="${emote[1].image}" alt="${emote[0]}"/>`;
                    else replacements[emote[0]] = `<img class="emote" src="${emote[1].image}" alt="${emote[0]}"/>`;
                }
            });

            message = escapeHtml(message);

            const replacementKeys = Object.keys(replacements);
            replacementKeys.sort(function (a, b) {
                return b.length - a.length;
            });

            replacementKeys.forEach(replacementKey => {
                if (replacementKey === message) {
                    message = replacements[replacementKey];
                    return;
                }

                const regex = new RegExp(`(?<!\\S)(${escapeRegExp(replacementKey)})(?!\\S)`, 'g');
                message = message
                    .replace(new RegExp("(?<!\\s)(\\[emote:)(?!\\s)", 'g'), " $&")
                    .replace(regex, replacements[replacementKey]);
            });

            $message.html(message);

            // Writing zero-width emotes
            messageNodes = $message.children();
            messageNodes.each(function (i) {
                if (i !== 0 && $(this).data('zw') && ($(messageNodes[i - 1]).hasClass('emote') || $(messageNodes[i - 1]).hasClass('emoji')) && !$(messageNodes[i - 1]).data('zw')) {
                    const $container = $('<span></span>');
                    $container.addClass('zero-width_container');
                    $(this).addClass('zero-width');
                    $(this).before($container);
                    $container.append(messageNodes[i - 1], this);
                }
            });
            $message.html($message.html().trim());
            $chatLine.append($message);
            Chat.info.lines.push($chatLine.wrap('<div>').parent().html());
        }
    },

    removeChatLineById: function (id) {
        $(`div[data-id=${id}]`).remove();
    },

    removeUserChatLines: function (id) {
        $(`div[data-user-id=${id}]`).remove();
    },

    connect: async function (channel) {
        if (!Chat.info.contentLoaded) {
            Chat.info.channel = channel;
            const title = $(document).prop('title');
            $(document).prop('title', title + Chat.info.channel);


            await Chat.load();
        }

        console.log('Connecting...');
        const baseUrl = "wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c";
        const urlParams = new URLSearchParams({
            protocol: "7",
            client: "js",
            version: "7.4.0",
            flash: false,
        });

        const url = `${baseUrl}?${urlParams.toString()}`;

        const socket = new WebSocket(url);

        socket.onopen = function () {
            socket.send(JSON.stringify({
                event: "pusher:subscribe",
                data: {auth: "", channel: `chatrooms.${Chat.info.chatRoomId}.v2`},
            }));

            console.log('connected');
        };

        socket.onclose = function () {
            console.log('Disconnected');
            setTimeout(Chat.connect, 1e3 * 5, Chat.info.channel);
        };

        socket.onmessage = function (messageEvent) {
            const messageEventJSON = JSON.parse(messageEvent.data.toString());
            let data = {};

            if (typeof messageEventJSON.data === 'string') {
                data = JSON.parse(messageEventJSON.data);
            }

            switch (messageEventJSON.event) {
                case "App\\Events\\ChatMessageEvent":
                    Chat.writeLine(data);

                    break;
                case "App\\Events\\MessageDeletedEvent":
                    Chat.removeChatLineById(data.message.id);

                    break;
                case "App\\Events\\UserBannedEvent":
                    Chat.removeUserChatLines(data.user.id);

                    break;

            }
        }
    },

    writeLine: function (data) {
        const message = data.content;
        const username = data.sender.username;
        const info = {
            id: data.id,
            userId: data.sender.id,
            badges: data.sender.identity.badges,
            color: data.sender.identity.color,
            displayName: data.sender.username,
            emotes: []
        };

        try {
            const emoteRegex = /\[emote:\d+:[^\]]+\]/g;
            const matches = message.match(emoteRegex);
            if (matches && matches.length) {
                matches.forEach(match => {
                    const parts = match.substring(7, match.length - 1).split(":");
                    info.emotes.push({
                        id: parts.at(0),
                        code: match,
                    })
                });
            }

        } catch (error) {
            console.log("Message filter error:", error);
        }

        Chat.write(username, info, message);
    }
};

$(document).ready(function () {
    Chat.connect($.QueryString.channel ? $.QueryString.channel.toLowerCase() : 'pixelprodig');
});

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
        showBots: ('bots' in $.QueryString ? ($.QueryString.bots.toLowerCase() === 'true') : false),
        hideCommands: ('hide_commands' in $.QueryString ? ($.QueryString.hide_commands.toLowerCase() === 'true') : false),
        hideBadges: ('hide_badges' in $.QueryString ? ($.QueryString.hide_badges.toLowerCase() === 'true') : false),
        fade: ('fade' in $.QueryString ? parseInt($.QueryString.fade) : false),
        size: ('size' in $.QueryString ? parseInt($.QueryString.size) : 3),
        font: ('font' in $.QueryString ? parseInt($.QueryString.font) : 0),
        stroke: ('stroke' in $.QueryString ? parseInt($.QueryString.stroke) : false),
        shadow: ('shadow' in $.QueryString ? parseInt($.QueryString.shadow) : false),
        smallCaps: ('small_caps' in $.QueryString ? ($.QueryString.small_caps.toLowerCase() === 'true') : false),
        emotes: {},
        badges: {},
        userBadges: {},
        ffzapBadges: null,
        bttvBadges: null,
        seventvBadges: null,
        chatterinoBadges: null,
        cheers: {},
        lines: [],
        blockedUsers: ('block' in $.QueryString ? $.QueryString.block.toLowerCase().split(',') : false),
        bots: ['streamelements', 'streamlabs', 'nightbot', 'moobot', 'fossabot']
    },

    loadEmotes: function (channelID) {
        Chat.info.emotes = {};

        fetch('https://api.betterttv.net/3/cached/emotes/global')
            .then(res => res.json())
            .then(function (res) {
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
            .then(function (res) {
                res.emotes.forEach(emote => {
                    Chat.info.emotes[emote.name] = {
                        id: emote.id,
                        image: `https:${emote.data.host.url}/${emote.data.host.files.at(4).name}`,
                        zeroWidth: false
                    };
                });
            });

    },

    load: function (callback) {
        fetch('https://kick.com/api/v2/channels/' + Chat.info.channel)
            .then((res) => res.json())
            .then(function (res) {
                console.log(res);
                Chat.info.channelID = res.chatroom.id;
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

                callback(true);
            });
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
            const $userInfo = $('<span></span>');
            $userInfo.addClass('user_info');


            const badges = [];
            const priorityBadges = ['broadcaster', 'moderator', 'sub_gifter', 'vip', 'og', 'verified'];
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
            $username.html(info['display-name'] ? info['display-name'] : nick);
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

            message = escapeHtml(message);

            const replacementKeys = Object.keys(replacements);
            replacementKeys.sort(function (a, b) {
                return b.length - a.length;
            });

            replacementKeys.forEach(replacementKey => {
                message = message.replaceAll(replacementKey, replacements[replacementKey]);
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

    connect: function (channel) {
        Chat.info.channel = channel;
        const title = $(document).prop('title');
        $(document).prop('title', title + Chat.info.channel);

        Chat.load(function () {
                console.log('jChat: Connecting to IRC server...');
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
                        data: {auth: "", channel: `chatrooms.${Chat.info.channelID}.v2`},
                    }));

                    console.log('connected');
                };

                socket.onclose = function () {
                    console.log('jChat: Disconnected');
                };


                socket.onmessage = function (data) {
                    const messageEventJSON = JSON.parse(data.data.toString());
                    if (messageEventJSON.event === "App\\Events\\ChatMessageEvent") {
                        const data = JSON.parse(messageEventJSON.data);
                        const message = data.content;
                        const username = data.sender.username;
                        const info = {
                            id: data.sender.id,
                            badges: data.sender.identity.badges,
                            color: data.sender.identity.color,
                            'display-name': data.sender.username,
                            emotes: []
                        };
                        if (data.sender.identity.badges.length) console.log(data.sender.identity.badges);

                        try {
                            const emoteRegex = /\[emote:\d+:[^\]]+\]/g;
                            const matches = message.match(emoteRegex);
                            if (matches.length) {
                                matches.forEach(match => {
                                    const parts = match.substring(7, match.length - 1).split(":");
                                    console.log(match, parts);
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
                }
            }
        )
        ;
    }
}
;

$(document).ready(function () {
    Chat.connect($.QueryString.channel ? $.QueryString.channel.toLowerCase() : 'giambaj');
});
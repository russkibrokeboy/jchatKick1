(function ($) {
    let params = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
        params[key] = value;
    });

    $.QueryString = params;
})(jQuery);

$(document).ready(function () {
    ChatOptions.setOptions($.QueryString);
    new Chat({
        channel: $.QueryString.channel ? $.QueryString.channel.toLowerCase() : 'russkibrokeboy',
        lines: [],
        channelID: null,
        chatRoomId: null,
        contentLoaded: false,
    });
});
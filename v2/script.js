(function ($) {
    let params = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
        params[key] = value;
    });

    $.QueryString = params;
})(jQuery);

$(document).ready(function () {
    new Chat({
        channel: $.QueryString.channel ? $.QueryString.channel.toLowerCase() : 'pixelprodig',
        animate: ('animate' in $.QueryString ? ($.QueryString.animate.toLowerCase() === 'true') : false),
        fade: ('fade' in $.QueryString ? parseInt($.QueryString.fade) : false),
        size: ('size' in $.QueryString ? parseInt($.QueryString.size) : 3),
        font: ('font' in $.QueryString ? parseInt($.QueryString.font) : 0),
        stroke: ('stroke' in $.QueryString ? parseInt($.QueryString.stroke) : false),
        shadow: ('shadow' in $.QueryString ? parseInt($.QueryString.shadow) : false),
        smallCaps: ('small_caps' in $.QueryString ? ($.QueryString.small_caps.toLowerCase() === 'true') : false),
        lines: [],
        channelID: null,
        chatRoomId: null,
        contentLoaded: false,
    });
});
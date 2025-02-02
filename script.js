$(document).ready(() => {
    // jQuery element declarations
    const $fade_bool = $('#fade_bool');
    const $fade = $('#fade');
    const $fade_seconds = $('#fade_seconds');
    const $size = $('#size');
    const $font = $('#font');
    const $stroke = $('#stroke');
    const $shadow = $('#shadow');
    const $badges = $('#badges');

    // Helper functions
    function appendCSS(type, value) {
        console.log(`Appending CSS: ${type}=${value}`);
    }

    function removeCSS(type) {
        console.log(`Removing CSS: ${type}`);
    }

    // Event handlers
    function fadeOption(event) {
        if ($fade_bool.is(':checked')) {
            $fade.removeClass('hidden');
            $fade_seconds.removeClass('hidden');
        } else {
            $fade.addClass('hidden');
            $fade_seconds.addClass('hidden');
        }
    }

    function sizeUpdate(event) {
        let size = sizes[Number($size.val()) - 1];
        removeCSS('size');
        appendCSS('size', size);
    }

    function fontUpdate(event) {
        let font = fonts[Number($font.val())];
        removeCSS('font');
        appendCSS('font', font);
    }

    function strokeUpdate(event) {
        removeCSS('stroke');
        if ($stroke.val() == "0") return;
        let stroke = strokes[Number($stroke.val()) - 1];
        appendCSS('stroke', stroke);
    }

    function shadowUpdate(event) {
        removeCSS('shadow');
        if ($shadow.val() == "0") return;
        let shadow = shadows[Number($shadow.val()) - 1];
        appendCSS('shadow', shadow);
    }

    function badgesUpdate(event) {
        if ($badges.is(':checked')) {
            $('img[class="badge special"]').addClass('hidden');
        } else {
            $('img[class="badge special hidden"]').removeClass('hidden');
        }
    }

    function capsUpdate(event) {
        if ($small_caps.is(':checked')) {
            appendCSS('variant', 'SmallCaps');
        } else {
            removeCSS('variant');
        }
    }

    function generateURL(event) {
        event.preventDefault();

        const generatedUrl = 'https://russkibrokeboy.github.io/jchatKick1/v2/index.html?channel=' + $channel.val();

        let data = {
            size: $size.val(),
            font: $font.val(),
            stroke: ($stroke.val() != '0' ? $stroke.val() : false),
            shadow: ($shadow.val() != '0' ? $shadow.val() : false),
            bots: $bots.is(':checked'),
            hide_commands: $commands.is(':checked'),
            hide_badges: $badges.is(':checked'),
            animate: $animate.is(':checked'),
            fade: ($fade_bool.is(':checked') ? $fade.val() : false),
            small_caps: $small_caps.is(':checked'),
            show_replies: $show_replies.is(':checked')
        };

        const params = encodeQueryData(data);

        $url.val(generatedUrl + '&' + params);

        $generator.addClass('hidden');
        $result.removeClass('hidden');
    }

    function changePreview(event) {
        if ($example.hasClass("white")) {
            $example.removeClass("white");
            $brightness.attr('src', "img/light.png");
        } else {
            $example.addClass("white");
            $brightness.attr('src', "img/dark.png");
        }
    }

    function copyUrl(event) {
        navigator.clipboard.writeText($url.val());

        $alert.css('visibility', 'visible');
        $alert.css('opacity', '1');
    }

    function showUrl(event) {
        $alert.css('opacity', '0');
        setTimeout(function() {
            $alert.css('visibility', 'hidden');
        }, 200);
    }

    function resetForm(event) {
        $channel.val('');
        $size.val('3');
        $font.val('0');
        $stroke.val('0');
        $shadow.val('0');
        $bots.prop('checked', false);
        $commands.prop('checked', false);
        $badges.prop('checked', false);
        $animate.prop('checked', false);
        $fade_bool.prop('checked', false);
        $fade.addClass('hidden');
        $fade_seconds.addClass('hidden');
        $fade.val("30");
        $small_caps.prop('checked', false);
        $show_replies.prop('checked', false);

        sizeUpdate();
        fontUpdate();
        strokeUpdate();
        shadowUpdate();
        badgesUpdate();
        capsUpdate();
        if ($example.hasClass("white"))
            changePreview();

        $result.addClass('hidden');
        $generator.removeClass('hidden');
        showUrl();
    }

    // Event bindings
    $fade_bool.on('change', fadeOption);
    $size.on('change', sizeUpdate);
    $font.on('change', fontUpdate);
    $stroke.on('change', strokeUpdate);
    $shadow.on('change', shadowUpdate);
    $badges.on('change', badgesUpdate);
    $small_caps.change(capsUpdate);
    $generator.submit(generateURL);
    $brightness.click(changePreview);
    $url.click(copyUrl);
    $alert.click(showUrl);
    $reset.click(resetForm);

    // Initialize chat if Chat class is available
    if (typeof Chat !== 'undefined') {
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
    } else {
        console.error('Chat class not loaded');
    }
});